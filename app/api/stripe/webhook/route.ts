// app/api/stripe/webhook/route.ts
//
// Nexusply — Stripe webhook (production-ready)
//
// Design:
// - Stripe is the source of truth. Each event is reduced to a subscription ID,
//   then the CURRENT subscription is fetched from Stripe and synced to the
//   profile. Out-of-order or duplicate events always end in the correct state.
// - Version-safe: reads the new (basil/dahlia) field locations first, with
//   fallbacks to the legacy ones.
// - Any failure returns 500 so Stripe retries. Nothing is silently lost.
//
// Events to enable on the Stripe destination:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.paid, invoice.payment_failed

import { stripe } from '@/lib/stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

// The Stripe SDK needs the Node runtime, and webhooks must never be cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────
// Types & small helpers
// ─────────────────────────────────────────────────────────────

type ProfileStatus = 'active' | 'past_due' | 'canceled'

type ProfileRef = {
  id: string
  stripe_subscription_id: string | null
}

const PROFILE_FIELDS = 'id, stripe_subscription_id'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Stripe fields can be an ID string or an expanded object. Returns the ID either way. */
function idOf(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) return (value as { id: string }).id
  return null
}

/** Maps Stripe price IDs to internal plan names. Empty env vars are ignored. */
function getPlanMap(): Record<string, string> {
  const entries: Array<[string | undefined, string]> = [
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER, 'explorateur'],
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER, 'importateur'],
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER, 'partenaire'],
  ]
  const map: Record<string, string> = {}
  for (const [priceId, plan] of entries) {
    if (priceId) map[priceId] = plan
  }
  return map
}

/**
 * Maps a Stripe subscription status to the profile status.
 * Returns null when the profile should not be touched yet.
 */
function mapStatus(status: string): ProfileStatus | null {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      // 'incomplete': the first payment has not settled yet. A later event will follow.
      return null
  }
}

/** Current period end. Since API 2025-03-31.basil it lives on subscription items. */
function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0] as any
  const ts: number | undefined =
    item?.current_period_end ?? (subscription as any).current_period_end
  return ts ? new Date(ts * 1000).toISOString() : null
}

/** Safety net if Stripe returns no period end (should not happen for live subscriptions). */
function fallbackExpiry(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString()
}

/** Subscription ID of an invoice. Since basil it lives under invoice.parent. */
function getInvoiceSubscriptionId(invoice: any): string | null {
  return (
    idOf(invoice?.parent?.subscription_details?.subscription) ??
    idOf(invoice?.subscription) // legacy API versions
  )
}

// ─────────────────────────────────────────────────────────────
// Supabase access
// ─────────────────────────────────────────────────────────────

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // Service role key bypasses RLS: server-to-server only, never exposed to the browser.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function findProfileBy(
  db: SupabaseClient,
  column: 'id' | 'stripe_customer_id' | 'stripe_subscription_id',
  value: string
): Promise<ProfileRef | null> {
  const { data, error } = await db
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq(column, value)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Profile lookup by ${column} failed: ${error.message}`)
  return (data as ProfileRef | null) ?? null
}

/**
 * Finds the profile an event belongs to, from most to least reliable:
 * Supabase user ID → Stripe customer ID → subscription ID → customer metadata.
 */
async function findProfile(
  stripeClient: Stripe,
  db: SupabaseClient,
  ids: { userId: string | null; customerId: string | null; subscriptionId: string }
): Promise<ProfileRef | null> {
  if (ids.userId) {
    const profile = await findProfileBy(db, 'id', ids.userId)
    if (profile) return profile
  }

  if (ids.customerId) {
    const profile = await findProfileBy(db, 'stripe_customer_id', ids.customerId)
    if (profile) return profile
  }

  const bySubscription = await findProfileBy(db, 'stripe_subscription_id', ids.subscriptionId)
  if (bySubscription) return bySubscription

  // Last resort: the Stripe customer may carry the Supabase user ID in its metadata.
  if (ids.customerId) {
    const customer = await stripeClient.customers.retrieve(ids.customerId)
    const isDeleted = 'deleted' in customer && customer.deleted
    const uid = isDeleted ? undefined : (customer as Stripe.Customer).metadata?.supabase_uid
    if (uid) {
      const profile = await findProfileBy(db, 'id', uid)
      if (profile) return profile
    }
  }

  return null
}

/** Updates one profile with retries. Throws on persistent failure or if no row changed. */
async function updateProfile(
  db: SupabaseClient,
  profileId: string,
  update: Record<string, unknown>,
  context: string
): Promise<void> {
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await db
      .from('profiles')
      .update(update)
      .eq('id', profileId)
      .select('id')

    if (!error) {
      if (!data || data.length === 0) {
        throw new Error(`[${context}] profile ${profileId} was not updated (0 rows)`)
      }
      console.log(`WEBHOOK [${context}] profile ${profileId} updated`, update)
      return
    }

    lastError = error.message
    console.error(`WEBHOOK [${context}] update attempt ${attempt} failed:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    if (attempt < 3) await sleep(300 * attempt)
  }

  throw new Error(`[${context}] failed to update profile ${profileId}: ${lastError}`)
}

// ─────────────────────────────────────────────────────────────
// Idempotency
// ─────────────────────────────────────────────────────────────

async function isAlreadyProcessed(db: SupabaseClient, eventId: string): Promise<boolean> {
  const { data, error } = await db
    .from('stripe_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()

  if (error) throw new Error(`Idempotency check failed: ${error.message}`)
  return !!data
}

async function markProcessed(db: SupabaseClient, event: Stripe.Event): Promise<void> {
  const { error } = await db
    .from('stripe_events')
    .upsert({ id: event.id, type: event.type }, { onConflict: 'id', ignoreDuplicates: true })

  // Not fatal: the sync already succeeded and is safe to repeat.
  if (error) console.error(`WEBHOOK could not record event ${event.id}:`, error.message)
}

// ─────────────────────────────────────────────────────────────
// Core: sync one subscription from Stripe to its profile
// ─────────────────────────────────────────────────────────────

async function syncSubscription(
  stripeClient: Stripe,
  db: SupabaseClient,
  subscriptionId: string,
  userIdHint: string | null,
  context: string
): Promise<void> {
  // Always read the latest state from Stripe, never the (possibly stale) event payload.
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
  const customerId = idOf(subscription.customer)
  const userId = userIdHint ?? subscription.metadata?.supabase_uid ?? null

  const profile = await findProfile(stripeClient, db, {
    userId,
    customerId,
    subscriptionId: subscription.id,
  })

  if (!profile) {
    // Throwing makes Stripe retry later, e.g. once checkout.session.completed has linked the user.
    throw new Error(
      `[${context}] no profile found for subscription ${subscription.id} (customer ${customerId})`
    )
  }

  const status = mapStatus(subscription.status)
  if (!status) {
    console.log(`WEBHOOK [${context}] ${subscription.id} is "${subscription.status}", waiting`)
    return
  }

  // An old or secondary subscription must never downgrade a profile that follows another one.
  if (
    profile.stripe_subscription_id &&
    profile.stripe_subscription_id !== subscription.id &&
    status !== 'active'
  ) {
    console.log(
      `WEBHOOK [${context}] skipping ${subscription.id} (${status}): profile follows ${profile.stripe_subscription_id}`
    )
    return
  }

  const update: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
  }
  if (customerId) update.stripe_customer_id = customerId

  if (status === 'canceled') {
    update.active_plan = 'free'
    update.plan_expires_at = null
  } else {
    const priceId = subscription.items.data[0]?.price?.id
    const plan = priceId ? getPlanMap()[priceId] : undefined

    if (!plan) {
      // Fail loudly: never silently downgrade a paying customer.
      throw new Error(
        `[${context}] unknown price ID "${priceId}" on ${subscription.id}. ` +
          `Check the NEXT_PUBLIC_STRIPE_PRICE_ID_* env vars (live vs test).`
      )
    }

    update.active_plan = plan
    update.plan_expires_at = getPeriodEnd(subscription) ?? fallbackExpiry()
  }

  await updateProfile(db, profile.id, update, context)
}

// ─────────────────────────────────────────────────────────────
// Event routing
// ─────────────────────────────────────────────────────────────

async function handleEvent(
  stripeClient: Stripe,
  db: SupabaseClient,
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode !== 'subscription') {
        console.log(`WEBHOOK [${event.type}] mode "${session.mode}", skipping`)
        return
      }
      if (session.payment_status === 'unpaid') {
        // Delayed payment method: wait for checkout.session.async_payment_succeeded.
        console.log(`WEBHOOK [${event.type}] payment not settled yet, waiting`)
        return
      }

      const subscriptionId = idOf(session.subscription)
      if (!subscriptionId) {
        throw new Error(`[${event.type}] subscription session ${session.id} has no subscription`)
      }

      const userId = session.metadata?.supabase_uid ?? session.client_reference_id ?? null
      await syncSubscription(stripeClient, db, subscriptionId, userId, event.type)
      return
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscription(
        stripeClient,
        db,
        subscription.id,
        subscription.metadata?.supabase_uid ?? null,
        event.type
      )
      return
    }

    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const subscriptionId = getInvoiceSubscriptionId(event.data.object)
      if (!subscriptionId) {
        console.log(`WEBHOOK [${event.type}] one-off invoice, skipping`)
        return
      }
      await syncSubscription(stripeClient, db, subscriptionId, null, event.type)
      return
    }

    default:
      console.log(`WEBHOOK unhandled event type "${event.type}", skipping`)
  }
}

// ─────────────────────────────────────────────────────────────
// Request handler
// ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!stripe) {
    console.error('WEBHOOK FATAL: Stripe client is not configured')
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('WEBHOOK FATAL: STRIPE_WEBHOOK_SECRET is missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const db = getSupabaseAdmin()
  if (!db) {
    console.error('WEBHOOK FATAL: Supabase URL or service role key is missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
  }

  // Raw body is required for signature verification. Do not parse it as JSON first.
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('WEBHOOK signature verification failed:', error?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`WEBHOOK received ${event.type} (${event.id})`)

  try {
    if (await isAlreadyProcessed(db, event.id)) {
      console.log(`WEBHOOK ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    await handleEvent(stripe, db, event)
    await markProcessed(db, event)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    // 500 makes Stripe retry with backoff (for up to 3 days in live mode).
    console.error(`WEBHOOK ERROR on ${event.type} (${event.id}):`, error?.message ?? error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
