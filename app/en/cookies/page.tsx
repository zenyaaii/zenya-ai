import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How and why Zenya uses cookies and similar technologies, which categories are set, and how to change your choices.',
  alternates: {
    canonical: `${SITE}/en/cookies`,
    languages: { en: `${SITE}/en/cookies`, ar: `${SITE}/cookies`, 'x-default': `${SITE}/cookies` },
  },
  openGraph: {
    title: 'Zenya cookie policy',
    description: 'Which cookies Zenya sets, why, and how long they last.',
    url: `${SITE}/en/cookies`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnCookiePolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Cookie Policy</h1>
      <p className="text-sm text-muted">
        Last updated: <strong>{COMPANY.LAST_UPDATED}</strong>
      </p>

      <p>
        This cookie policy explains how {COMPANY.LEGAL_NAME} (&quot;we&quot;) uses cookies and similar
        tracking technologies on <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files your browser stores on your device. They let websites remember you and
        your preferences. We also use similar technologies such as <code>localStorage</code> to save
        preferences on the client side.
      </p>

      <h2>2. The categories we use</h2>

      <h3>2.1 Strictly necessary (always on)</h3>
      <p>
        These are required for the service to work. We do not ask for consent for them under EU law,
        because you cannot switch them off without breaking the service.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sb-*-auth-token</code></td>
              <td>Supabase authentication session</td>
              <td>One year (renewed)</td>
            </tr>
            <tr>
              <td><code>zenya_return_to</code></td>
              <td>Remembers where to send you back to after Shopify authentication (OAuth)</td>
              <td>10 minutes</td>
            </tr>
            <tr>
              <td><code>zenya_consent</code> (localStorage)</td>
              <td>Remembers your choice in the cookie banner</td>
              <td>12 months</td>
            </tr>
            <tr>
              <td><code>zenya_last_email</code> (localStorage)</td>
              <td>Pre-fills the login form on this device</td>
              <td>Until cleared</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>2.2 Functional (consent required)</h3>
      <p>
        These improve the service, such as a dark mode preference. We currently use{' '}
        <code>localStorage</code> for these and only set them once you actually use the feature.
      </p>

      <h3>2.3 Analytics (consent required, currently off by default)</h3>
      <p>
        If and when we enable product analytics (such as Plausible or Vercel Analytics), we will list every
        provider here and will not load them until you have accepted analytics cookies in the banner.
      </p>

      <h3>2.4 Marketing (consent required, not used)</h3>
      <p>
        We currently use no advertising or retargeting cookies. If that changes, this page will be updated
        and you will see the banner ask for consent again.
      </p>

      <h2>3. Third-party cookies at checkout</h2>
      <p>
        When you pay through Stripe Checkout, Stripe may set its own cookies on the{' '}
        <code>checkout.stripe.com</code> domain for fraud prevention and session management. Those are
        governed by{' '}
        <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener">
          Stripe&apos;s cookie policy
        </a>
        .
      </p>

      <h2>4. Managing your choices</h2>
      <ul>
        <li>Use the &quot;Cookie preferences&quot; link in the footer to change your consent.</li>
        <li>
          Most browsers let you block cookies from settings, but blocking strictly necessary cookies will
          break sign-in.
        </li>
        <li>You can clear cookies and localStorage from your browser at any time.</li>
      </ul>

      <h2>5. Contact</h2>
      <p>
        Questions about cookies?{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
      </p>

      <hr />
      <p className="text-sm text-muted">
        This is an English translation provided for convenience. The Arabic version at{' '}
        <a href="/cookies">zenyaai.co/cookies</a> is the authoritative text; if the two differ, the Arabic
        version prevails.
      </p>
    </main>
  )
}
