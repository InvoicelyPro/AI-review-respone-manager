import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (company) {
        const plan = subscription.items.data[0]?.price.nickname?.toLowerCase() || 'starter'

        await supabase.from('subscriptions').upsert({
          company_id: company.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          plan,
          renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'company_id' })

        await supabase.from('companies').update({
          subscription_tier: subscription.status === 'active' ? plan : 'free',
        }).eq('id', company.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (company) {
        await supabase.from('subscriptions').update({
          status: 'canceled',
        }).eq('company_id', company.id)

        await supabase.from('companies').update({
          subscription_tier: 'free',
        }).eq('id', company.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
