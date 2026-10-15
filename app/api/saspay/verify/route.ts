// app/api/saspay/verify/route.ts
//
// Called by the dashboard when the customer comes back from the SasPay checkout.
// Checks the payment with SasPay directly, so the plan activates right away
// even if the webhook is late. The webhook does the same work; whichever runs
// first applies the plan, the other one is a no-op.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isSaspayConfigured } from '@/lib/saspay'
import { PAYMENT_FIELDS, reconcilePayment, type PlanPayment } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  const db = getSupabaseAdmin()
  if (!db || !isSaspayConfigured()) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let paymentId: unknown
  try {
    paymentId = (await req.json())?.paymentId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (typeof paymentId !== 'string' || !UUID_RE.test(paymentId)) {
    return NextResponse.json({ error: 'Invalid payment' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await db
    .from('plan_payments')
    .select(PAYMENT_FIELDS)
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('SASPAY VERIFY lookup failed:', error.message)
    return NextResponse.json({ error: 'Could not check the payment' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  try {
    const result = await reconcilePayment(db, data as PlanPayment)
    return NextResponse.json(result)
  } catch (err: unknown) {
    // Transient (SasPay unreachable, etc.): the client keeps polling and the webhook still runs.
    console.error(`SASPAY VERIFY ${paymentId} failed:`, err instanceof Error ? err.message : err)
    return NextResponse.json({ status: 'pending', plan: data.plan, plan_expires_at: null })
  }
}
