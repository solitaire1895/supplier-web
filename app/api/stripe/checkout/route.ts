import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      maxNetworkRetries: 3,
      timeout: 20000,
      typescript: true,
    })
  : null
