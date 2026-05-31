import type { Metadata } from 'next'
import { COMPANY, formatAddress } from '@/lib/company'

export const metadata: Metadata = {
  title: `Terms of Service — ${COMPANY.BRAND_NAME}`,
  description: `Terms governing your use of ${COMPANY.PRODUCT_NAME}.`,
  alternates: { canonical: '/terms' },
}

export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
        use of the website <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>{' '}
        and the {COMPANY.PRODUCT_NAME} service (collectively, the &ldquo;Service&rdquo;)
        operated by <strong>{COMPANY.LEGAL_NAME}</strong> ({COMPANY.ENTITY_TYPE},
        registered with the Dutch Chamber of Commerce under number{' '}
        {COMPANY.KVK_NUMBER}). By creating an account or using the Service you
        agree to be bound by these Terms.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>&ldquo;<strong>We</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, &ldquo;<strong>our</strong>&rdquo; — {COMPANY.LEGAL_NAME}.</li>
        <li>&ldquo;<strong>You</strong>&rdquo;, &ldquo;<strong>your</strong>&rdquo; — the individual or entity using the Service.</li>
        <li>&ldquo;<strong>Generated Content</strong>&rdquo; — themes, copy, images, and other output the Service produces from your inputs.</li>
        <li>&ldquo;<strong>Subscription</strong>&rdquo; — the paid plan you purchase to access premium features.</li>
      </ul>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 16 years old and capable of forming a binding
        contract under the law of your country of residence. If you use the
        Service on behalf of a company, you represent that you have authority
        to bind that company.
      </p>

      <h2>3. The Service</h2>
      <p>
        {COMPANY.PRODUCT_NAME} is an AI-assisted website and Shopify theme
        generator. You provide inputs (business brief, product URLs, brand
        details); we generate content and visual designs using third-party AI
        models. Output quality, accuracy, and suitability for your specific
        purpose are <strong>not guaranteed</strong>; you are responsible for
        reviewing Generated Content before publishing it.
      </p>

      <h2>4. Account</h2>
      <ul>
        <li>You must provide accurate registration information.</li>
        <li>You are responsible for safeguarding your password.</li>
        <li>You are responsible for all activity under your account.</li>
        <li>One account per person/entity. Sharing credentials is not permitted.</li>
        <li>You can delete your account at any time at <a href="/settings">/settings</a>.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You must not, and must not allow others to:</p>
      <ul>
        <li>Use the Service to create content that is illegal, defamatory, infringing, discriminatory, sexually explicit involving minors, or harmful.</li>
        <li>Generate content impersonating real people or brands without permission.</li>
        <li>Scrape, reverse-engineer, or extract our prompts, models, or proprietary logic.</li>
        <li>Resell or sublicense the Service or Generated Content as a competing AI service.</li>
        <li>Bypass quota or rate limits, including by creating multiple accounts.</li>
        <li>Submit content that violates third-party rights (copyright, trademark, privacy).</li>
        <li>Use the Service to spam, phish, distribute malware, or run any unlawful business.</li>
      </ul>
      <p>
        Violations may result in immediate suspension or termination without
        refund.
      </p>

      <h2>6. Subscription, Billing &amp; Trials</h2>
      <ul>
        <li><strong>Free tier:</strong> up to 3 themes per account.</li>
        <li><strong>Pro:</strong> {COMPANY.PRICE_DISPLAY} (in {COMPANY.CURRENCY}), billed automatically via Stripe.</li>
        <li><strong>Free trial:</strong> {COMPANY.TRIAL_DAYS} days. You may cancel before the trial ends to avoid being charged.</li>
        <li>The subscription renews automatically at the end of each billing period unless cancelled before renewal.</li>
        <li>You can cancel at any time from your Stripe customer portal or by emailing us. Cancellation takes effect at the end of the current paid period; you retain access until then.</li>
        <li>All fees are exclusive of applicable VAT/sales tax, which we charge where required.</li>
        <li>Payment is processed by Stripe. By subscribing, you also agree to{' '}
          <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener">Stripe&rsquo;s Terms</a>.
        </li>
      </ul>

      <h2>7. Refunds &amp; Right of Withdrawal</h2>
      <p>
        Full details: <a href="/refund">Refund Policy</a>. Summary: EU consumers
        have a 14-day right of withdrawal under Article 6:230o of the Dutch
        Civil Code. By starting to use the Service (including generating a
        theme) you expressly request immediate performance and acknowledge
        that, once a theme has been generated using your paid Pro features,
        the right of withdrawal is lost in respect of that performance.
      </p>

      <h2>8. Generated Content — ownership &amp; licence</h2>
      <ul>
        <li>You retain ownership of your <strong>inputs</strong> (brief, product data, brand materials).</li>
        <li>To the extent the law allows, you own the <strong>outputs</strong> generated for you, and may use them commercially for your own business.</li>
        <li>We retain ownership of the Service, the underlying AI prompts, the templates, the platform code, and the brand &ldquo;{COMPANY.BRAND_NAME}&rdquo;.</li>
        <li>AI-generated content is not copyrightable in all jurisdictions; we make no warranty of exclusivity. Other users may receive similar outputs from similar inputs.</li>
        <li>You grant us a worldwide, royalty-free, non-exclusive licence to host, display, and process your inputs and outputs solely to provide the Service.</li>
      </ul>

      <h2>9. Third-party services</h2>
      <p>
        The Service integrates with OpenAI, Stripe, Supabase, Vercel,
        ScraperAPI, and (optionally) Shopify. Your use of those integrations
        is subject to their own terms. We are not responsible for their
        availability, content, or actions. If you connect a Shopify store you
        also agree to Shopify&rsquo;s App Store and Partner Program Agreements.
      </p>

      <h2>10. AI &amp; output disclaimer</h2>
      <p>
        The Service uses large language models that can produce inaccurate,
        biased, or fabricated content (&ldquo;hallucinations&rdquo;). You must
        review Generated Content for accuracy, legality, and suitability
        before publishing it. <strong>We are not liable for any consequence
        of using unreviewed Generated Content</strong>, including but not
        limited to factual errors, IP infringement claims by third parties,
        or regulatory violations on your live website.
      </p>

      <h2>11. Service availability</h2>
      <p>
        We target high availability but do not guarantee uninterrupted
        Service. We may perform maintenance, update features, or suspend the
        Service for security. We are not liable for downtime caused by
        third-party providers (Vercel, Supabase, Stripe, OpenAI, etc.) or
        force majeure events.
      </p>

      <h2>12. Termination</h2>
      <ul>
        <li>You may terminate by deleting your account at any time.</li>
        <li>We may suspend or terminate your account immediately, without refund, for breach of these Terms or applicable law.</li>
        <li>We may terminate inactive free accounts after 12 months of no activity (with email notice).</li>
        <li>Upon termination, your access ends. Personal data is handled per the <a href="/privacy">Privacy Policy</a>.</li>
      </ul>

      <h2>13. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the Service is provided
        &ldquo;as is&rdquo; without warranties of merchantability, fitness for
        a particular purpose, or non-infringement. To the maximum extent
        permitted by Dutch law, our total liability for any claim arising out
        of these Terms or the Service is limited to the greater of (a) the
        fees you paid us in the 12 months preceding the event, or (b)
        €100. We are not liable for indirect, incidental, consequential,
        special, or punitive damages, including lost profits or data loss.
      </p>
      <p>
        Nothing in these Terms limits liability for death, personal injury
        caused by negligence, fraud, or any other liability that cannot be
        excluded under Dutch law.
      </p>

      <h2>14. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from any claim, damage,
        or expense (including reasonable legal fees) arising from (a) your
        use of the Service, (b) your inputs or published Generated Content,
        (c) your breach of these Terms, or (d) your violation of any law or
        third-party right.
      </p>

      <h2>15. Changes to the Service or Terms</h2>
      <p>
        We may modify the Service or these Terms at any time. Material changes
        will be announced by email to registered users at least 30 days
        before they take effect. Continued use after the effective date means
        you accept the changes. If you do not accept, you may terminate your
        account before they take effect.
      </p>

      <h2>16. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by {COMPANY.GOVERNING_LAW}, excluding its
        conflict-of-laws rules. The UN Convention on Contracts for the
        International Sale of Goods does not apply. Any dispute will be
        submitted to the exclusive jurisdiction of {COMPANY.COMPETENT_COURT},
        subject to consumers&rsquo; mandatory right to bring proceedings in
        their country of residence under EU law.
      </p>
      <p>
        EU consumers may also use the European Commission&rsquo;s{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">
          Online Dispute Resolution platform
        </a>.
      </p>

      <h2>17. Miscellaneous</h2>
      <ul>
        <li><strong>Severability:</strong> if any clause is unenforceable, the rest stays in force.</li>
        <li><strong>No waiver:</strong> failure to enforce a right is not a waiver.</li>
        <li><strong>Assignment:</strong> you may not assign your rights without our consent; we may assign in case of merger/acquisition.</li>
        <li><strong>Entire agreement:</strong> these Terms plus the <a href="/privacy">Privacy Policy</a>, <a href="/cookies">Cookie Policy</a>, and <a href="/refund">Refund Policy</a> form the entire agreement.</li>
      </ul>

      <h2>18. Contact</h2>
      <ul>
        <li>Legal: <a href={`mailto:${COMPANY.LEGAL_EMAIL}`}>{COMPANY.LEGAL_EMAIL}</a></li>
        <li>Support: <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a></li>
        <li>Postal: {formatAddress()}</li>
      </ul>
    </main>
  )
}
