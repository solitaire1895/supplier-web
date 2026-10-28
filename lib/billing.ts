// lib/billing.ts
//
// Turns SasPay payments into plan periods. Shared by the webhook and by the
// return-page verification, so a payment is applied as soon as EITHER of them
// sees it, and exactly once (fulfill_plan_payment() locks and checks the row).
//
// SasPay is the source of truth: we never trust a webhook body on its own, we
// always re-read the transaction from the API before granting anything.

import type { SupabaseClient } from '@supabase/supabase-js'
import { after } from 'next/server'
import { sendPaymentConfirmation } from '@/lib/notifications'
import {
  getCheckoutSession,
  sessionTransactionId,
  verifyPayment,
  type SaspayTransaction,
} from '@/lib/saspay'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'

export interface PlanPayment {
  id: string
  user_id: string
  plan: string
  amount: number | string
  currency: string
  status: PaymentStatus
  saspay_session_id: string | null
  saspay_checkout_url: string | null
  saspay_transaction_id: string | null
  period_end: string | null
  created_at: string
}

export interface ReconcileResult {
  /** 'failed' with retryable=true means the attempt failed but the checkout is still open. */
  status: PaymentStatus
  plan: string
  plan_expires_at: string | null
  retryable?: boolean
  message?: string
}

export const PAYMENT_FIELDS =
  'id, user_id, plan, amount, currency, status, saspay_session_id, saspay_checkout_url, saspay_transaction_id, period_end, created_at'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** How far back the webhook looks for an unlinked checkout session. */
const MATCH_WINDOW_HOURS = 72
const MATCH_SCAN_LIMIT = 50

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function paidAmountOf(tx: SaspayTransaction): number {
  return Number(tx.requested_amount ?? tx.amount ?? NaN)
}

async function updatePayment(db: SupabaseClient, id: string, update: Record<string, unknown>) {
  const { error } = await db
    .from('plan_payments')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`plan_payments update failed for ${id}: ${error.message}`)
}

async function paymentBy(
  db: SupabaseClient,
  column: 'id' | 'saspay_transaction_id',
  value: string
): Promise<PlanPayment | null> {
  const { data, error } = await db.from('plan_payments').select(PAYMENT_FIELDS).eq(column, value).maybeSingle()
  if (error) throw new Error(`plan_payments lookup by ${column} failed: ${error.message}`)
  return (data as PlanPayment | null) ?? null
}

function result(payment: PlanPayment, status: PaymentStatus, extra: Partial<ReconcileResult> = {}): ReconcileResult {
  return { status, plan: payment.plan, plan_expires_at: payment.period_end, ...extra }
}

// ─────────────────────────────────────────────────────────────
// Matching a SasPay transaction to one of our payments
// ─────────────────────────────────────────────────────────────

/**
 * Finds the plan payment a transaction belongs to, from most to least direct:
 * linked transaction ID → our payment_id in the transaction metadata →
 * recent open checkout sessions whose `transaction` is this one.
 */
export async function findPaymentForTransaction(
  db: SupabaseClient,
  tx: SaspayTransaction,
  { scanSessions }: { scanSessions: boolean }
): Promise<PlanPayment | null> {
  const linked = await paymentBy(db, 'saspay_transaction_id', tx.id)
  if (linked) return linked

  const metaId = tx.metadata?.payment_id
  if (typeof metaId === 'string' && UUID_RE.test(metaId)) {
    const byMeta = await paymentBy(db, 'id', metaId)
    if (byMeta) return byMeta
  }

  if (!scanSessions) return null

  const since = new Date(Date.now() - MATCH_WINDOW_HOURS * 3600_000).toISOString()
  const { data, error } = await db
    .from('plan_payments')
    .select(PAYMENT_FIELDS)
    .in('status', ['pending', 'cancelled', 'expired'])
    .is('saspay_transaction_id', null)
    .not('saspay_session_id', 'is', null)
    .eq('currency', (tx.currency ?? '').toUpperCase())
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MATCH_SCAN_LIMIT)
  if (error) throw new Error(`plan_payments scan failed: ${error.message}`)

  const candidates = (data as PlanPayment[]) ?? []
  const paid = paidAmountOf(tx)
  // Sessions with the same amount first: almost always the first one matches.
  candidates.sort((a, b) => Number(Number(b.amount) === paid) - Number(Number(a.amount) === paid))

  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5)
    const sessions = await Promise.all(batch.map((p) => getCheckoutSession(p.saspay_session_id!)))
    const index = sessions.findIndex((s) => sessionTransactionId(s) === tx.id)
    if (index !== -1) return batch[index]
  }

  return null
}

// ─────────────────────────────────────────────────────────────
// Reconciling one payment
// ─────────────────────────────────────────────────────────────

/**
 * Brings one plan payment in line with SasPay and applies the plan if it is paid.
 * Safe to call any number of times, concurrently, from anywhere.
 * Pass `knownTx` when the transaction was already fetched from the API.
 */
export async function reconcilePayment(
  db: SupabaseClient,
  payment: PlanPayment,
  knownTx?: SaspayTransaction | null
): Promise<ReconcileResult> {
  if (payment.status === 'paid') return result(payment, 'paid')

  let tx = knownTx ?? null

  if (!tx) {
    let txId = payment.saspay_transaction_id

    if (!txId && payment.saspay_session_id) {
      const session = await getCheckoutSession(payment.saspay_session_id)
      txId = sessionTransactionId(session)

      if (!txId) {
        if (session.status === 'EXPIRED' || session.status === 'CANCELLED') {
          const status: PaymentStatus = session.status === 'EXPIRED' ? 'expired' : 'cancelled'
          if (payment.status === 'pending') await updatePayment(db, payment.id, { status })
          return result(payment, status)
        }
        return result(payment, payment.status)
      }
    }

    if (!txId) return result(payment, payment.status)
    tx = await verifyPayment(txId)
  }

  switch (tx.status) {
    case 'SUCCESS':
      return applySuccessfulTransaction(db, payment, tx)

    case 'FAILED':
    case 'CANCELLED':
      // The customer can retry on the same checkout page, so the payment stays open.
      await updatePayment(db, payment.id, { last_error: `transaction ${tx.id} ${tx.status}` })
      return result(payment, 'failed', {
        retryable: true,
        message: tx.status === 'FAILED' ? 'payment_failed' : 'payment_cancelled',
      })

    default:
      return result(payment, 'pending')
  }
}

async function applySuccessfulTransaction(
  db: SupabaseClient,
  payment: PlanPayment,
  tx: SaspayTransaction
): Promise<ReconcileResult> {
  const paid = paidAmountOf(tx)
  const expected = Number(payment.amount)
  const metaId = tx.metadata?.payment_id

  const problem =
    typeof metaId === 'string' && metaId && metaId !== payment.id
      ? `transaction ${tx.id} belongs to payment ${metaId}`
      : tx.currency?.toUpperCase() !== payment.currency.toUpperCase()
        ? `currency mismatch: paid ${tx.currency}, expected ${payment.currency}`
        : !Number.isFinite(paid) || paid + 0.005 < expected
          ? `amount mismatch: paid ${paid}, expected ${expected}`
          : null

  if (problem) {
    console.error(`BILLING payment ${payment.id} rejected: ${problem}`)
    await updatePayment(db, payment.id, { status: 'failed', last_error: problem })
    return result(payment, 'failed', { message: 'payment_mismatch' })
  }

  const { data, error } = await db.rpc('fulfill_plan_payment', {
    p_payment_id: payment.id,
    p_transaction_id: tx.id,
    p_paid_amount: paid,
  })

  if (error) {
    if (error.code === '23505') {
      // Unique index: this transaction already paid for a different plan payment.
      console.error(`BILLING transaction ${tx.id} already used, payment ${payment.id} not applied`)
      await updatePayment(db, payment.id, { status: 'failed', last_error: `transaction ${tx.id} already used` })
      return result(payment, 'failed', { message: 'payment_mismatch' })
    }
    throw new Error(`fulfill_plan_payment failed for ${payment.id}: ${error.message}`)
  }

  const out = (data ?? {}) as { outcome?: string; plan?: string; plan_expires_at?: string }
  console.log(`BILLING payment ${payment.id} ${out.outcome}: ${out.plan} until ${out.plan_expires_at}`)

  // Receipt email, only the first time the payment is applied. Runs after the
  // response so the webhook / return page never wait on Resend.
  if (out.outcome === 'fulfilled') {
    after(() => sendPaymentConfirmation(payment.id))
  }
  return {
    status: 'paid',
    plan: out.plan ?? payment.plan,
    plan_expires_at: out.plan_expires_at ?? null,
  }
}
