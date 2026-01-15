import Stripe from 'stripe'

// Safely initialize Stripe. If key is missing, it will throw only when used.
// We can handle this by checking env before calls in API routes.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16',
  typescript: true,
})
