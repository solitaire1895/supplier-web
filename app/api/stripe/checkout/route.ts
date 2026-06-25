import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

// Small retry helper to survive transient network errors (e.g. ECONNRESET)
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500
): Promise<T> {
  let lastError: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      const code = error?.code || error?.cause?.code
      const isNetworkError =
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNREFUSED' ||
        code === 'EAI_AGAIN' ||
        error?.type === 'StripeConnectionError'

      if (!isNetworkError || attempt === retries) {
        throw error
      }

      // Exponential backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }
  throw lastError
}

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    // Assign to a local const so TypeScript keeps the non-null narrowing
    // inside the closures passed to withRetry().
    const stripeClient = stripe

    let body: { priceId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { priceId } = body
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid priceId' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('STRIPE CHECKOUT AUTH ERROR:', authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in again.' },
        { status: 401 }
      )
    }

    // Get profile to check for stripe_customer_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create a new customer in Stripe (with retry for transient network errors)
      const customer = await withRetry(() =>
        stripeClient.customers.create({
          email: user.email || profile?.email || undefined,
          metadata: {
            supabase_uid: user.id,
          },
        })
      )
      customerId = customer.id

      // Update profile with customerId
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Resolve a reliable origin for redirect URLs
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin

    // Create checkout session (with retry for transient network errors)
    const session = await withRetry(() =>
      stripeClient.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard?success=true`,
        cancel_url: `${origin}/dashboard/subscribe?canceled=true`,
        metadata: {
          supabase_uid: user.id,
        },
      })
    )

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('STRIPE CHECKOUT ERROR:', error)

    const code = error?.code || error?.cause?.code
    if (code === 'ECONNRESET' || error?.type === 'StripeConnectionError') {
      return NextResponse.json(
        { error: 'Could not reach the payment provider. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
