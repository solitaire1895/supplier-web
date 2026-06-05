import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // We use the Service Role Key to bypass RLS since webhooks are server-to-server
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

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
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const session = event.data.object as any

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        const plan = PRICE_ID_TO_PLAN[priceId] || 'free'
        const userId = session.metadata.supabase_uid

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            active_plan: plan,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = session
        const priceId = subscription.items.data[0].price.id
        const plan = PRICE_ID_TO_PLAN[priceId] || 'free'
        const status = subscription.status === 'active' ? 'active' : 'past_due'

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: status,
            active_plan: plan,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = session
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            active_plan: 'free',
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
