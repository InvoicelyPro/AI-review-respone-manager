import Stripe from 'stripe'

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2025-01-27.acacia' as any,
  })
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe]
  },
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    features: ['Up to 100 reviews/month', '1 location', 'AI response generation', 'Risk detection'],
  },
  professional: {
    name: 'Professional',
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: ['Up to 500 reviews/month', '5 locations', 'AI response generation', 'Risk detection', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    price: 199,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID || '',
    features: ['Unlimited reviews', 'Unlimited locations', 'AI response generation', 'Risk detection', 'White-label', 'Dedicated support'],
  },
}
