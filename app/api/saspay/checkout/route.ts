// app/api/saspay/checkout/route.ts
//
// Opens a SasPay hosted checkout for one plan period.
// The price comes from lib/plans.ts on the server; the browser only sends the plan key.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createCheckoutSession, isSaspayConfigured, SaspayError } from '@/lib/saspay'
import { PAYMENT_FIELDS, type PlanPayment } from '@/lib/billing'
import { PLANS, PLAN_PERIOD_DAYS, isPaidPlan } from '@/lib/plans'
import { findBillingCountry, planPrice } from '@/lib/currencies'
import { getPayableCountries, guessCountry } from '@/lib/billing-countries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** How long a hosted checkout stays payable. */
const SESSION_TTL_MINUTES = 60
/** A pending checkout younger than this is reused (double clicks, back button). */
const REUSE_WINDOW_MINUTES = 30
/** At most this many new checkouts per account per window. */
const RATE_MAX_CHECKOUTS = 8
const RATE_WINDOW_MINUTES = 15

export async function POST(req: Request) {
  if (!isSaspayConfigured()) {
    console.error('SASPAY CHECKOUT: SASPAY_SECRET_KEY is missing')
    return NextResponse.json({ error: 'Payments are not configured' }, { status: 500 })
  }

  const db = getSupabaseAdmin()
  if (!db) {
    console.error('SASPAY CHECKOUT: Supabase service role is missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let body: { plan?: unknown; country?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const plan = body.plan
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 })
  }

  // Rate limit, persisted in the database: each checkout creates a payment row
  // and a SasPay session, so cap how many one account can open.
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString()
  const { count: recentCheckouts } = await db
    .from('plan_payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', windowStart)
  if ((recentCheckouts ?? 0) >= RATE_MAX_CHECKOUTS) {
    return NextResponse.json(
      { error: 'Too many payment attempts. Please wait a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(RATE_WINDOW_MINUTES * 60) } }
    )
  }

  // The country decides the currency; the price comes from the server-side table.
  const payable = await getPayableCountries()
  const requested = typeof body.country === 'string' ? findBillingCountry(body.country) : undefined
  if (body.country !== undefined && (!requested || !payable.some((c) => c.iso === requested.iso))) {
    return NextResponse.json({ error: 'Payments are not available in this country yet' }, { status: 400 })
  }
  const country = requested ?? guessCountry(req.headers, payable)
  const currency = country.currency
  const amount = planPrice(plan, currency)

  // Reuse a fresh open checkout for the same plan instead of opening a second one.
  const reuseSince = new Date(Date.now() - REUSE_WINDOW_MINUTES * 60_000).toISOString()
  const { data: existing } = await db
    .from('plan_payments')
    .select(PAYMENT_FIELDS)
    .eq('user_id', user.id)
    .eq('plan', plan)
    .eq('amount', amount)
    .eq('currency', currency)
    .eq('country', country.iso)
    .eq('status', 'pending')
    .not('saspay_checkout_url', 'is', null)
    .gte('created_at', reuseSince)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const reusable = existing as PlanPayment | null
  if (reusable?.saspay_checkout_url) {
    return NextResponse.json({ url: reusable.saspay_checkout_url, paymentId: reusable.id })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const email = user.email || profile?.email
  if (!email) {
    return NextResponse.json({ error: 'Your account has no email address' }, { status: 400 })
  }
  const name =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split('@')[0]

  // 1. Record the payment first, so the webhook can always find it.
  const { data: created, error: insertError } = await db
    .from('plan_payments')
    .insert({
      user_id: user.id,
      plan,
      amount,
      currency,
      period_days: PLAN_PERIOD_DAYS,
      country: country.iso,
      base_amount: PLANS[plan].price, // in BASE_CURRENCY, used to credit unused time on plan changes
    })
    .select('id')
    .single()

  if (insertError || !created) {
    console.error('SASPAY CHECKOUT: could not record payment:', insertError?.message)
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 500 })
  }

  const paymentId: string = created.id
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || new URL(req.url).origin
  const feeMode = process.env.SASPAY_FEE_CHARGE_MODE === 'DEDUCTED' ? 'DEDUCTED' : 'ADD_ON'

  // 2. Open the hosted checkout.
  try {
    const session = await createCheckoutSession({
      amount,
      currency,
      customer_email: email,
      customer_name: name,
      description: `Nexusply ${PLANS[plan].name.FR} - ${PLAN_PERIOD_DAYS} jours`,
      country: country.iso,
      return_url: `${origin.replace(/\/+$/, '')}/dashboard?payment=${paymentId}`,
      fee_charge_mode: feeMode,
      expires_at: new Date(Date.now() + SESSION_TTL_MINUTES * 60_000).toISOString(),
      metadata: { payment_id: paymentId, user_id: user.id, plan },
    })

    if (!session?.id || !session.checkout_url) {
      throw new SaspayError('SasPay returned no checkout URL', null, session)
    }

    await db
      .from('plan_payments')
      .update({
        saspay_session_id: session.id,
        saspay_checkout_url: session.checkout_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    return NextResponse.json({ url: session.checkout_url, paymentId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('SASPAY CHECKOUT ERROR:', message, error instanceof SaspayError ? error.body : '')

    await db
      .from('plan_payments')
      .update({ status: 'failed', last_error: message, updated_at: new Date().toISOString() })
      .eq('id', paymentId)

    const unreachable = error instanceof SaspayError && error.retryable
    return NextResponse.json(
      {
        error: unreachable
          ? 'Could not reach the payment provider. Please try again.'
          : 'Could not start the payment. Please try again.',
      },
      { status: unreachable ? 503 : 502 }
    )
  }
}
