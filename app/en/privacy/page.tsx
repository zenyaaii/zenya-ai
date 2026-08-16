import type { Metadata } from 'next'
import { COMPANY, formatAddress } from '@/lib/company'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Privacy Policy — Zenya',
  description:
    'How Zenya collects, uses, stores, and protects your personal data: legal bases under GDPR, subprocessors, retention periods, your rights, and how to exercise them.',
  alternates: {
    canonical: `${SITE}/en/privacy`,
    languages: { en: `${SITE}/en/privacy`, ar: `${SITE}/privacy`, 'x-default': `${SITE}/privacy` },
  },
  openGraph: {
    title: 'Zenya privacy policy',
    description: 'GDPR legal bases, subprocessors, retention, and your rights.',
    url: `${SITE}/en/privacy`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnPrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted">
        Last updated: <strong>{COMPANY.LAST_UPDATED}</strong>
      </p>

      <p>
        This privacy policy explains how <strong>{COMPANY.LEGAL_NAME}</strong>, trading as{' '}
        <strong>Zenya AI</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), collects, uses, stores,
        and protects your personal data when you use <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>{' '}
        and the Zenya AI service (the &quot;Service&quot;).
      </p>

      <p>
        We act as the <strong>data controller</strong> for the personal data of people who sign up for the
        Service, and as a <strong>data processor</strong> for data that Shopify merchants provide to us about
        their own customers (rare; see section 4).
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>
          <strong>Data controller:</strong> {COMPANY.LEGAL_NAME} (Dutch sole proprietorship, eenmanszaak)
        </li>
        <li>
          <strong>Registration:</strong> Dutch Chamber of Commerce (KvK), number{' '}
          <strong>{COMPANY.KVK_NUMBER}</strong>. The natural person who operates Musannef and acts as data
          controller is publicly identifiable via the KvK register using this number, or on request via the
          privacy contact below.
        </li>
        <li>
          <strong>VAT:</strong> Registration pending (BTW)
        </li>
        <li>
          <strong>Address:</strong> {formatAddress()}
        </li>
        <li>
          <strong>Contact for privacy questions:</strong>{' '}
          <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
        </li>
      </ul>

      <h2>2. The data we collect</h2>

      <h3>2.1 Data you give us directly</h3>
      <ul>
        <li>
          <strong>Account data:</strong> email address, password (stored hashed via Supabase), and full name
          (optional).
        </li>
        <li>
          <strong>Payment data:</strong> handled by Stripe. We never see or store your card number, CVC, or
          bank details. We receive the customer ID, the last 4 digits of the card, the country, and the
          subscription status.
        </li>
        <li>
          <strong>Content you create:</strong> your business descriptions, the product links you submit for
          scraping, and the template designs you generate.
        </li>
        <li>
          <strong>Support correspondence:</strong> the messages you send us.
        </li>
      </ul>

      <h3>2.2 Data collected automatically</h3>
      <ul>
        <li>
          <strong>Technical data:</strong> IP address, browser type, device type, operating system, referring
          URL, and timestamps. Used for security and abuse prevention.
        </li>
        <li>
          <strong>Usage data:</strong> features used, templates generated, and generation counts (to enforce
          the free plan quota).
        </li>
        <li>
          <strong>Cookies and similar:</strong> see the <a href="/en/cookies">Cookie Policy</a>.
        </li>
      </ul>

      <h3>2.3 Data we receive from Shopify (only if you connect a store)</h3>
      <ul>
        <li>Store domain, store owner email, and store owner name.</li>
        <li>
          Product data (title, description, images, price), read in order to generate templates that match
          your catalogue.
        </li>
        <li>Theme data, read and written in order to install generated themes.</li>
      </ul>
      <p>
        We do <strong>not</strong> read or store Shopify customer data (orders, customer profiles,
        addresses). Our scopes are{' '}
        <code>read_products, read_themes, write_products, write_themes</code>.
      </p>

      <h2>3. Why we use your data (legal bases under GDPR Article 6)</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Legal basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Providing the Service (account, template generation, hosting)</td>
              <td>Performance of a contract (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td>Processing payments and billing</td>
              <td>Contract plus legal obligation (tax law)</td>
            </tr>
            <tr>
              <td>Security, abuse prevention, and fraud detection</td>
              <td>Legitimate interest (Art. 6(1)(f))</td>
            </tr>
            <tr>
              <td>Service messages (such as password resets and receipts)</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Marketing messages (only if you explicitly opt in)</td>
              <td>Consent (Art. 6(1)(a))</td>
            </tr>
            <tr>
              <td>Analytics and product improvement</td>
              <td>Consent (cookie banner)</td>
            </tr>
            <tr>
              <td>Complying with legal obligations (such as tax retention)</td>
              <td>Legal obligation (Art. 6(1)(c))</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Who we share data with (subprocessors)</h2>
      <p>
        We share only what is necessary, and only with trusted providers. The full list with locations:{' '}
        <a href="/en/subprocessors">Subprocessors</a>. In summary:
      </p>
      <ul>
        <li><strong>Supabase</strong> (Ireland, EU) — database, authentication, and file storage.</li>
        <li><strong>Vercel</strong> (United States, with EU edge) — hosting and CDN.</li>
        <li><strong>Stripe</strong> (United States, with an EU subsidiary) — payment processing.</li>
        <li>
          <strong>OpenAI</strong> (United States) — AI generation of template content (your business
          description is sent; your data is <em>not</em> used to train models, per their API terms).
        </li>
        <li><strong>ScraperAPI</strong> (United States) — product page scraping (the URL you submitted is sent).</li>
        <li><strong>Shopify</strong> (Canada) — only if you connect a store.</li>
      </ul>
      <p>
        For transfers outside the EU/EEA we rely on the{' '}
        <strong>standard contractual clauses</strong> issued by the European Commission and, for US
        providers, on the <strong>EU-US Data Privacy Framework</strong>.
      </p>
      <p>
        We <strong>never sell</strong> your personal data, and we do not share it for advertising purposes.
      </p>

      <h2>5. How long we keep your data</h2>
      <ul>
        <li><strong>Account data:</strong> for as long as your account is active, then deleted within 30 days of account deletion.</li>
        <li><strong>Generated templates and designs:</strong> deleted with your account; you can delete individual templates at any time.</li>
        <li><strong>Payment records and invoices:</strong> kept for 7 years in compliance with Dutch tax law (Art. 52 of the General State Taxes Act).</li>
        <li><strong>Backups:</strong> a rolling 30-day backup window, after which deletions propagate.</li>
        <li><strong>Logs (security, errors):</strong> 90 days.</li>
      </ul>

      <h2>6. Your rights under the GDPR</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> your personal data and obtain a copy (Art. 15).</li>
        <li><strong>Rectify</strong> inaccurate data (Art. 16).</li>
        <li><strong>Erase</strong> your account and data (Art. 17) — self-service at <a href="/settings">Settings → Delete account</a>.</li>
        <li><strong>Restrict</strong> processing (Art. 18).</li>
        <li><strong>Data portability</strong> — export your templates as JSON (Art. 20).</li>
        <li><strong>Object</strong> to processing based on legitimate interest (Art. 21).</li>
        <li><strong>Withdraw consent</strong> at any time (for example cancelling a subscription, or revoking cookie consent).</li>
        <li>
          <strong>Lodge a complaint</strong> with your local data protection authority. For the Netherlands:{' '}
          <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener">Autoriteit Persoonsgegevens</a>.
        </li>
      </ul>
      <p>
        To exercise any of these rights, write to{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>. We respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <ul>
        <li>All data in transit is encrypted via TLS (HTTPS).</li>
        <li>Passwords are hashed with bcrypt (handled by Supabase Auth).</li>
        <li>Database access uses Postgres row-level security; users see only their own rows.</li>
        <li>Secrets are stored encrypted at rest within Vercel.</li>
        <li>We follow the principle of least privilege for staff access.</li>
      </ul>
      <p>
        If you discover a security vulnerability, please write to{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a> with the subject
        &quot;Security&quot;. We do not currently run a bug bounty programme, but we will acknowledge
        responsible disclosure.
      </p>

      <h2>8. Data breaches</h2>
      <p>
        In the event of a personal data breach, we will notify the Dutch data protection authority
        (Autoriteit Persoonsgegevens) within 72 hours where required, and will notify affected users without
        undue delay if there is a high risk to your rights.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not directed at users under the age of 16. If you believe a child has provided us with
        personal data, contact us and we will delete it.
      </p>

      <h2>10. AI processing</h2>
      <p>
        When you request a generated template, we send your business description and any related text to the
        OpenAI API. Under the OpenAI API data usage policy, this data is{' '}
        <strong>not used to train models</strong> and is retained for up to 30 days for abuse prevention
        only. We do not send your name, your email address, or any account identifiers to OpenAI.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        If we make material changes, we will email registered users and update the &quot;Last updated&quot;
        date above. Continuing to use the Service after changes means you accept the updated policy.
      </p>

      <h2>12. Contact</h2>
      <ul>
        <li>Privacy questions: <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a></li>
        <li>General support: <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a></li>
        <li>Post: {formatAddress()}</li>
      </ul>

      <hr />
      <p className="text-sm text-muted">
        This is an English translation provided for convenience. The Arabic version at{' '}
        <a href="/privacy">zenyaai.co/privacy</a> is the authoritative text; if the two differ, the Arabic
        version prevails.
      </p>
    </main>
  )
}
