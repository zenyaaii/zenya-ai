import type { Metadata } from 'next'
import { COMPANY, formatAddress } from '@/lib/company'

export const metadata: Metadata = {
  title: `Privacy Policy — ${COMPANY.BRAND_NAME}`,
  description: `How ${COMPANY.PRODUCT_NAME} collects, uses, and protects your personal data. GDPR-compliant.`,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted">
        Last updated: <strong>{COMPANY.LAST_UPDATED}</strong>
      </p>

      <p>
        This Privacy Policy explains how <strong>{COMPANY.LEGAL_NAME}</strong>,
        operating as <strong>{COMPANY.PRODUCT_NAME}</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, stores, and
        protects your personal data when you use{' '}
        <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a> and the
        {' '}{COMPANY.PRODUCT_NAME} service (the &ldquo;Service&rdquo;).
      </p>

      <p>
        We act as the <strong>data controller</strong> for personal data of
        people who sign up for the Service, and as a{' '}
        <strong>data processor</strong> for data that Shopify merchants give us
        about their customers (rare; see §4).
      </p>

      <h2>1. Who we are</h2>
      <ul>
        <li>
          <strong>Controller:</strong> {COMPANY.LEGAL_NAME}
          {' '}({COMPANY.ENTITY_TYPE})
        </li>
        <li>
          <strong>Registered:</strong> Dutch Chamber of Commerce (KvK), number{' '}
          <strong>{COMPANY.KVK_NUMBER}</strong>. The natural person operating
          Musannef and acting as data controller is publicly identifiable via
          the KvK register using this number, or on request via the privacy
          contact below.
        </li>
        <li>
          <strong>VAT:</strong> {COMPANY.VAT_NUMBER}
        </li>
        <li>
          <strong>Address:</strong> {formatAddress()}
        </li>
        <li>
          <strong>Contact for privacy questions:</strong>{' '}
          <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
        </li>
      </ul>

      <h2>2. What data we collect</h2>

      <h3>2.1 Data you give us directly</h3>
      <ul>
        <li>
          <strong>Account data:</strong> email address, password (stored hashed
          by Supabase), full name (optional).
        </li>
        <li>
          <strong>Payment data:</strong> handled by Stripe. We never see or
          store your card number, CVC, or bank details. We receive a
          customer ID, last 4 digits of the card, country, and subscription
          status.
        </li>
        <li>
          <strong>Content you create:</strong> business briefs, product URLs
          you submit for scraping, theme designs you generate.
        </li>
        <li>
          <strong>Support correspondence:</strong> emails you send us.
        </li>
      </ul>

      <h3>2.2 Data collected automatically</h3>
      <ul>
        <li>
          <strong>Technical data:</strong> IP address, browser type, device
          type, OS, referring URL, timestamps. Used for security and abuse
          prevention.
        </li>
        <li>
          <strong>Usage data:</strong> features used, themes generated,
          generation count (for free-tier quota enforcement).
        </li>
        <li>
          <strong>Cookies and similar:</strong> see our{' '}
          <a href="/cookies">Cookie Policy</a>.
        </li>
      </ul>

      <h3>2.3 Data we get from Shopify (only if you connect a store)</h3>
      <ul>
        <li>Shop domain, shop owner email, shop owner name.</li>
        <li>Product data (title, description, images, price) — read to
          generate themes that match your catalog.</li>
        <li>Theme data — read/write to install generated themes.</li>
      </ul>
      <p>
        We do <strong>not</strong> read or store Shopify customer data
        (orders, customer profiles, addresses). Our scopes are
        <code>read_products, read_themes, write_products, write_themes</code>.
      </p>

      <h2>3. Why we use your data (legal bases under GDPR Article 6)</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Provide the Service (account, theme generation, hosting)</td>
            <td>Contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Process payments and billing</td>
            <td>Contract + legal obligation (tax law)</td>
          </tr>
          <tr>
            <td>Security, abuse prevention, fraud detection</td>
            <td>Legitimate interest (Art. 6(1)(f))</td>
          </tr>
          <tr>
            <td>Service emails (e.g. password reset, receipts)</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Marketing emails (only if you opt in)</td>
            <td>Consent (Art. 6(1)(a))</td>
          </tr>
          <tr>
            <td>Analytics / improving the product</td>
            <td>Consent (cookie banner)</td>
          </tr>
          <tr>
            <td>Comply with legal obligations (e.g. tax retention)</td>
            <td>Legal obligation (Art. 6(1)(c))</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Who we share data with (subprocessors)</h2>
      <p>
        We share only what&rsquo;s necessary, only with vetted providers. Full
        list with versions and locations: <a href="/subprocessors">Subprocessors</a>.
        Summary:
      </p>
      <ul>
        <li><strong>Supabase</strong> (Ireland, EU) — database, authentication, file storage.</li>
        <li><strong>Vercel</strong> (USA, with EU edge) — hosting, CDN.</li>
        <li><strong>Stripe</strong> (USA, EU subsidiary) — payment processing.</li>
        <li><strong>OpenAI</strong> (USA) — AI generation of theme content (sends your business brief; does <em>not</em> use your data for model training per their API terms).</li>
        <li><strong>ScraperAPI</strong> (USA) — product-page scraping (sends the URL you submitted).</li>
        <li><strong>Shopify</strong> (Canada) — only if you connect a store.</li>
      </ul>
      <p>
        For transfers outside the EU/EEA we rely on the EU Commission&rsquo;s{' '}
        <strong>Standard Contractual Clauses</strong> and (for US providers) the{' '}
        <strong>EU–U.S. Data Privacy Framework</strong>.
      </p>
      <p>
        We <strong>never sell</strong> your personal data. We do not share it
        for advertising.
      </p>

      <h2>5. How long we keep your data</h2>
      <ul>
        <li><strong>Account data:</strong> while your account is active, then deleted within 30 days of account deletion.</li>
        <li><strong>Generated themes &amp; designs:</strong> deleted with your account; you can delete individual themes at any time.</li>
        <li><strong>Payment records / invoices:</strong> retained for 7 years to comply with Dutch tax law (Algemene wet inzake rijksbelastingen art. 52).</li>
        <li><strong>Backups:</strong> rolling 30-day backup window, after which deletions propagate.</li>
        <li><strong>Logs (security, error):</strong> 90 days.</li>
      </ul>

      <h2>6. Your rights under GDPR</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> your personal data and get a copy (Art. 15).</li>
        <li><strong>Rectify</strong> incorrect data (Art. 16).</li>
        <li><strong>Erase</strong> your account and data (Art. 17) — self-service in <a href="/settings">Settings → Delete Account</a>.</li>
        <li><strong>Restrict</strong> processing (Art. 18).</li>
        <li><strong>Portability</strong> — export your themes as JSON (Art. 20).</li>
        <li><strong>Object</strong> to processing based on legitimate interest (Art. 21).</li>
        <li><strong>Withdraw consent</strong> at any time (e.g. unsubscribe, revoke cookie consent).</li>
        <li><strong>Lodge a complaint</strong> with your local data protection authority. For the Netherlands: <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener">Autoriteit Persoonsgegevens</a>.</li>
      </ul>
      <p>
        To exercise any right, email{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>.
        We respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <ul>
        <li>All traffic is TLS-encrypted (HTTPS).</li>
        <li>Passwords are hashed with bcrypt (handled by Supabase Auth).</li>
        <li>Database access uses Postgres Row-Level Security; users can only see their own rows.</li>
        <li>Secrets stored encrypted at rest in Vercel.</li>
        <li>We follow the principle of least privilege for staff access.</li>
      </ul>
      <p>
        If you discover a security vulnerability, please email{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>{' '}
        with subject &ldquo;Security&rdquo;. We do not currently run a bug bounty
        but we&rsquo;ll acknowledge responsible disclosure.
      </p>

      <h2>8. Data breaches</h2>
      <p>
        In the event of a personal data breach, we will notify the Dutch{' '}
        Autoriteit Persoonsgegevens within 72 hours where required, and
        affected users without undue delay if there is a high risk to your
        rights.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not intended for users under 16. If you believe a child
        has provided us personal data, contact us and we will delete it.
      </p>

      <h2>10. AI processing</h2>
      <p>
        When you request a generated theme, we send your business brief and
        any related text to OpenAI&rsquo;s API. Per OpenAI&rsquo;s API data
        usage policy, this data is <strong>not used to train models</strong>{' '}
        and is retained for up to 30 days for abuse-prevention only. We do
        not send your name, email, or any account identifiers to OpenAI.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        If we make material changes, we will email registered users and update
        the &ldquo;Last updated&rdquo; date above. Continued use after changes
        means you accept the updated policy.
      </p>

      <h2>12. Contact</h2>
      <ul>
        <li>Privacy questions: <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a></li>
        <li>General support: <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a></li>
        <li>Postal: {formatAddress()}</li>
      </ul>
    </main>
  )
}
