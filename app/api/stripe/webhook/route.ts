import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

function computeExpiry(subscription: any): string {
  // Prefer Stripe's billing period end; fallback to now + 30 days.
  const periodEnd = subscription?.current_period_end
  if (periodEnd) {
    return new Date(periodEnd * 1000).toISOString()
  }
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString()
}

function computeExpiryFromInvoice(invoice: any): string {
  // For invoice events, read period end from the first line item.
  const periodEnd = invoice?.lines?.data?.[0]?.period?.end
  if (periodEnd) {
    return new Date(periodEnd * 1000).toISOString()
  }
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString()
}

/**
 * Wraps a Supabase update call with error checking and retry logic.
 * Throws on persistent failure so the outer catch returns 500 to Stripe,
 * which causes Stripe to retry the webhook.
 */
async function updateProfileWithErrorCheck(
  supabaseAdmin: any,
  update: Record<string, any>,
  matchColumn: string,
  matchValue: string,
  context: string
): Promise<void> {
  let lastError: any = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(update)
      .eq(matchColumn, matchValue)
      .select('id, active_plan, subscription_status')

    if (error) {
      lastError = error
      console.error(`WEBHOOK [${context}] attempt ${attempt + 1} failed:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      // Brief backoff before retry
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
      continue
    }

    console.log(`WEBHOOK [${context}] success:`, {
      matched: matchColumn,
      value: matchValue,
      updatedRows: data?.length ?? 0,
      newPlan: data?.[0]?.active_plan,
      newStatus: data?.[0]?.subscription_status,
    })

    // If no rows were updated, the match column/value might be wrong
    if (!data || data.length === 0) {
      console.warn(`WEBHOOK [${context}] WARNING: 0 rows updated for ${matchColumn}=${matchValue}`)
    }

    return
  }

  // All retries exhausted — throw so Stripe retries the whole webhook
  throw new Error(
    `Failed to update profile (${context}) after 3 attempts: ${lastError?.message || 'unknown error'}`
  )
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  // Validate that the Service Role Key is present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('WEBHOOK FATAL: Missing Supabase environment variables.', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    })
    return NextResponse.json(
      { error: 'Server misconfigured: missing Supabase service role key' },
      { status: 500 }
    )
  }

  // We use the Service Role Key to bypass RLS since webhooks are server-to-server
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Mapping Stripe Price IDs to internal Plan names
  const PRICE_ID_TO_PLAN: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_EXPLORER || '']: 'explorateur',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_IMPORTER || '']: 'importateur',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PARTNER || '']: 'partenaire',
  }

  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('WEBHOOK SIGNATURE ERROR:', error.message)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const session = event.data.object as any

  console.log(`WEBHOOK received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const plan = PRICE_ID_TO_PLAN[priceId] || 'free'
        const userId = session.metadata?.supabase_uid

        if (!userId) {
          console.error('WEBHOOK [checkout.session.completed] ERROR: No supabase_uid in session metadata')
          throw new Error('Missing supabase_uid in checkout session metadata')
        }

        console.log(`WEBHOOK [checkout.session.completed] updating user ${userId} to plan: ${plan}`)

        await updateProfileWithErrorCheck(
          supabaseAdmin,
          {
            subscription_status: 'active',
            active_plan: plan,
            stripe_subscription_id: subscription.id,
            plan_expires_at: computeExpiry(subscription),
          },
          'id',
          userId,
          'checkout.session.completed'
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = session
        const priceId = subscription.items.data[0].price.id
        const plan = PRICE_ID_TO_PLAN[priceId] || 'free'
        const status = subscription.status === 'active' ? 'active' : 'past_due'

        console.log(`WEBHOOK [customer.subscription.updated] sub ${subscription.id} → plan: ${plan}, status: ${status}`)

        await updateProfileWithErrorCheck(
          supabaseAdmin,
          {
            subscription_status: status,
            active_plan: plan,
            plan_expires_at: computeExpiry(subscription),
          },
          'stripe_subscription_id',
          subscription.id,
          'customer.subscription.updated'
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = session

        console.log(`WEBHOOK [customer.subscription.deleted] sub ${subscription.id} → canceled/free`)

        await updateProfileWithErrorCheck(
          supabaseAdmin,
          {
            subscription_status: 'canceled',
            active_plan: 'free',
            plan_expires_at: null,
          },
          'stripe_subscription_id',
          subscription.id,
          'customer.subscription.deleted'
        )
        break
      }

      case 'invoice.paid': {
        // Fires on every successful charge — most reliable way to extend access on renewal.
        // Only process recurring subscription invoices (not one-off charges).
        const invoice = session
        if (!invoice.subscription) break

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const plan = PRICE_ID_TO_PLAN[priceId] || 'free'

        console.log(`WEBHOOK [invoice.paid] sub ${invoice.subscription} → plan: ${plan}`)

        await updateProfileWithErrorCheck(
          supabaseAdmin,
          {
            subscription_status: 'active',
            active_plan: plan,
            plan_expires_at: computeExpiryFromInvoice(invoice),
          },
          'stripe_subscription_id',
          invoice.subscription,
          'invoice.paid'
        )
        break
      }

      case 'invoice.payment_failed': {
        // Fires when a renewal charge fails. Flag the account for dunning.
        // Stripe will retry according to your retry settings in the dashboard.
        const invoice = session
        if (!invoice.subscription) break

        console.log(`WEBHOOK [invoice.payment_failed] sub ${invoice.subscription} → past_due`)

        await updateProfileWithErrorCheck(
          supabaseAdmin,
          {
            subscription_status: 'past_due',
          },
          'stripe_subscription_id',
          invoice.subscription,
          'invoice.payment_failed'
        )
        break
      }

      default:
        console.log(`WEBHOOK: unhandled event type "${event.type}" — skipping`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('WEBHOOK ERROR:', error.message || error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}