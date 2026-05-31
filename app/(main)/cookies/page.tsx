import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `Cookie Policy — ${COMPANY.BRAND_NAME}`,
  description: `How and why ${COMPANY.PRODUCT_NAME} uses cookies and similar technologies.`,
  alternates: { canonical: '/cookies' },
}

export default function CookiePolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Cookie Policy</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        This Cookie Policy explains how {COMPANY.LEGAL_NAME} (&ldquo;we&rdquo;)
        uses cookies and similar tracking technologies on{' '}
        <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device by your browser.
        They let websites remember you and your preferences. We also use
        similar technologies such as <code>localStorage</code> for
        client-side preferences.
      </p>

      <h2>2. The categories we use</h2>

      <h3>2.1 Strictly necessary (always on)</h3>
      <p>
        These are required for the Service to work. We do not ask consent for
        them under EU law because you cannot opt out without breaking the
        Service.
      </p>
      <table>
        <thead>
          <tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Supabase authentication session</td>
            <td>1 year (renewed)</td>
          </tr>
          <tr>
            <td><code>zenya_return_to</code></td>
            <td>Remember where to return you after Shopify OAuth</td>
            <td>10 minutes</td>
          </tr>
          <tr>
            <td><code>zenya_consent</code> (localStorage)</td>
            <td>Remember your cookie-banner choice</td>
            <td>12 months</td>
          </tr>
          <tr>
            <td><code>zenya_last_email</code> (localStorage)</td>
            <td>Pre-fill the login form on this device</td>
            <td>Until cleared</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Functional (consent required)</h3>
      <p>
        Enhance the Service (e.g. dark-mode preference). Currently we use{' '}
        <code>localStorage</code> for these and set them only after you
        actively use the feature.
      </p>

      <h3>2.3 Analytics (consent required — currently OFF by default)</h3>
      <p>
        If/when we enable product analytics (e.g. Plausible, Vercel
        Analytics), we will list each provider here and only load them after
        you accept analytics cookies in the banner.
      </p>

      <h3>2.4 Marketing (consent required — not used)</h3>
      <p>
        We do not currently use any advertising or remarketing cookies. If
        this changes, this page will be updated and you&rsquo;ll see a
        banner re-prompt.
      </p>

      <h2>3. Third-party cookies set on payment / checkout</h2>
      <p>
        When you go through Stripe Checkout, Stripe may set its own cookies
        on the <code>checkout.stripe.com</code> domain for fraud prevention
        and session management. These are governed by{' '}
        <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener">
          Stripe&rsquo;s cookie policy
        </a>.
      </p>

      <h2>4. Managing your choices</h2>
      <ul>
        <li>Use the &ldquo;Cookie preferences&rdquo; link in the footer to change your consent.</li>
        <li>Most browsers let you block cookies in settings, but blocking strictly-necessary cookies will break login.</li>
        <li>You can clear cookies and localStorage at any time from your browser.</li>
      </ul>

      <h2>5. Contact</h2>
      <p>
        Questions about cookies?{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
      </p>
    </main>
  )
}
