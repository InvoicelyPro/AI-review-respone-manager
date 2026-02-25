import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]

    const { data: userData } = await supabase
      .from('users')
      .select(`
        company_id,
        companies(name, stripe_customer_id)
      `)
      .eq('id', user.id)
      .single()

    const company = Array.isArray(userData?.companies)
      ? userData?.companies[0]
      : userData?.companies

    let customerId = company?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          company_id: userData?.company_id || '',
          company_name: company?.name || '',
        },
      })
      customerId = customer.id

      if (userData?.company_id) {
        await supabase.from('companies').update({
          stripe_customer_id: customerId,
        }).eq('id', userData.company_id)
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=subscribed`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
