/** True only when the loaded Stripe secret is a TEST-mode key. The money
 *  specs gate on this so they can never run against live keys. */
export function isStripeTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')
}

/** True when Porkbun credentials are present so domain lookups can run. */
export function hasPorkbunKeys(): boolean {
  return !!process.env.PORKBUN_API_KEY && !!process.env.PORKBUN_SECRET_API_KEY
}
