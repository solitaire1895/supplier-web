// app/api/saspay/webhook/route.ts
//
// Nexusply — SasPay webhook
//
// Register in the SasPay dashboard (https://app.saspay.me -> Webhooks):
//   URL:    https://<your-domain>/api/saspay/webhook
//   Events: transaction.success, transaction.failed, transaction.cancelled
// Copy the signing secret (shown once) into SASPAY_WEBHOOK_SECRET.
//
// Design:
// - The signature (X-Webhook-Signature = HMAC-SHA256 of "{timestamp}.{raw body}")
//   is verified before anything else.
// - The body is only a hint: the transaction is re-read from the SasPay API
//   and matched to a plan_payments row before any plan is granted.
// - Applying a payment is atomic and idempotent (fulfill_plan_payment), so
//   retries and the return-page verification can never double-credit.
// - Errors return 500 so SasPay retries (immediately, +30s, +5min, +30min, +2h).

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isSaspayConfigured, SaspayError, verifyPayment, verifyWebhookSignature } from '@/lib/saspay'
import { findPaymentForTransaction, reconcilePayment } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HANDLED_EVENTS = new Set(['transaction.success', 'transaction.failed', 'transaction.cancelled'])

interface WebhookEnvelope {
  event?: string
  data?: { id?: string; status?: string; [key: string]: unknown }
}

async function logEvent(db: SupabaseClient, row: Record<string, unknown>) {
  const { error } = await db.from('saspay_webhook_events').upsert(row, { onConflict: 'id' })
  // Logging must never make a delivery fail.
  if (error) console.error('SASPAY WEBHOOK could not log event:', error.message)
}

export async function POST(req: Request) {
  const secret = process.env.SASPAY_WEBHOOK_SECRET
  const db = getSupabaseAdmin()
  if (!secret || !db || !isSaspayConfigured()) {
    console.error('SASPAY WEBHOOK FATAL: SASPAY_WEBHOOK_SECRET, SASPAY_SECRET_KEY or Supabase service role missing')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Raw body is required for the signature. Do not parse it before verifying.
  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature')
  const timestamp = req.headers.get('x-webhook-timestamp')

  if (!verifyWebhookSignature(rawBody, signature, timestamp, secret)) {
    console.error('SASPAY WEBHOOK invalid signature or stale timestamp')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let envelope: WebhookEnvelope
  try {
    envelope = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = envelope.event || req.headers.get('x-webhook-event') || 'unknown'
  const transactionId = typeof envelope.data?.id === 'string' ? envelope.data.id : null
  const eventId = crypto.createHash('sha256').update(`${timestamp}.${rawBody}`).digest('hex')

  console.log(`SASPAY WEBHOOK received ${event} (${transactionId ?? 'no id'})`)

  if (!HANDLED_EVENTS.has(event)) {
    // webhook.test, settlements, wallet transfers...: acknowledge and ignore.
    return NextResponse.json({ received: true, ignored: event })
  }
  if (!transactionId) {
    return NextResponse.json({ received: true, ignored: 'no transaction id' })
  }

  // A redelivery of an event we already processed: nothing to do.
  const { data: seen } = await db
    .from('saspay_webhook_events')
    .select('processed_at')
    .eq('id', eventId)
    .maybeSingle()
  if (seen?.processed_at) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  await logEvent(db, { id: eventId, event, transaction_id: transactionId, payload: envelope })

  try {
    // Source of truth: the transaction as SasPay reports it now.
    const tx = await verifyPayment(transactionId)

    const payment = await findPaymentForTransaction(db, tx, {
      // Scanning open checkouts costs API calls: only worth it for a success.
      scanSessions: tx.status === 'SUCCESS',
    })

    if (!payment) {
      // Not one of our plan checkouts (e.g. a payment link sold elsewhere).
      console.warn(`SASPAY WEBHOOK no plan payment matches transaction ${tx.id} (${tx.status})`)
      await logEvent(db, {
        id: eventId, event, transaction_id: transactionId, payload: envelope,
        outcome: 'unmatched', processed_at: new Date().toISOString(),
      })
      return NextResponse.json({ received: true, matched: false })
    }

    const result = await reconcilePayment(db, payment, tx)

    await logEvent(db, {
      id: eventId, event, transaction_id: transactionId, payload: envelope,
      outcome: `${payment.id}:${result.status}`, error: null, processed_at: new Date().toISOString(),
    })

    return NextResponse.json({ received: true, status: result.status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (error instanceof SaspayError && error.status === 404) {
      // The transaction does not exist for this API key (e.g. test vs live): retrying won't help.
      console.warn(`SASPAY WEBHOOK transaction ${transactionId} not found via API`)
      await logEvent(db, {
        id: eventId, event, transaction_id: transactionId, payload: envelope,
        outcome: 'not_found', error: message, processed_at: new Date().toISOString(),
      })
      return NextResponse.json({ received: true, matched: false })
    }

    console.error(`SASPAY WEBHOOK ERROR on ${event} (${transactionId}):`, message)
    await logEvent(db, { id: eventId, event, transaction_id: transactionId, payload: envelope, error: message })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
