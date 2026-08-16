import type { Metadata } from 'next'
import { COMPANY, formatAddress } from '@/lib/company'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Terms of Service — Zenya',
  description: 'The terms governing your use of Zenya: eligibility, acceptable use, pricing and billing, ownership of generated content, liability, and governing law.',
  alternates: {
    canonical: `${SITE}/en/terms`,
    languages: { en: `${SITE}/en/terms`, ar: `${SITE}/terms`, 'x-default': `${SITE}/terms` },
  },
  openGraph: {
    title: 'Zenya terms of service',
    description: 'Eligibility, acceptable use, billing, content ownership, and governing law.',
    url: `${SITE}/en/terms`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnTermsOfService() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        These terms of service (the &quot;Terms&quot;) govern your access to and use of{' '}
        <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a> and the Zenya AI service (together, the
        &quot;Service&quot;), operated by <strong>{COMPANY.LEGAL_NAME}</strong> (a Dutch sole proprietorship,
        eenmanszaak, registered with the Dutch Chamber of Commerce under number {COMPANY.KVK_NUMBER}). By
        creating an account or using the Service, you agree to be bound by these Terms.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>&quot;<strong>We</strong>&quot;, &quot;<strong>us</strong>&quot;, &quot;<strong>our</strong>&quot; — {COMPANY.LEGAL_NAME}.</li>
        <li>&quot;<strong>You</strong>&quot;, &quot;<strong>your</strong>&quot; — the individual or entity using the Service.</li>
        <li>&quot;<strong>Generated Content</strong>&quot; — the templates, text, images, and other output the Service produces from your inputs.</li>
        <li>&quot;<strong>Paid Subscription</strong>&quot; (Starter or Pro) — a monthly, automatically renewing subscription that unlocks premium features for as long as your subscription is active.</li>
      </ul>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 16 years old and able to enter into a binding contract under the law of your
        country of residence. If you use the Service on behalf of a company, you represent that you have
        authority to bind that company.
      </p>

      <h2>3. The Service</h2>
      <p>
        Zenya AI is an AI-assisted generator of websites and Shopify themes. You provide the inputs (business
        description, product links, brand details); we generate content and visual designs using third-party
        AI models. The quality, accuracy, and fitness of the output for your particular purpose are{' '}
        <strong>not guaranteed</strong>, and you are responsible for reviewing Generated Content before
        publishing it.
      </p>

      <h2>4. Your account</h2>
      <ul>
        <li>You must provide accurate registration information.</li>
        <li>You are responsible for protecting your password.</li>
        <li>You are responsible for all activity that takes place through your account.</li>
        <li>One account per person or entity. Sharing credentials is not permitted.</li>
        <li>You can delete your account at any time from <a href="/settings">/settings</a>.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You must not, and must not permit others to:</p>
      <ul>
        <li>Use the Service to create unlawful, defamatory, infringing, discriminatory, sexually explicit content involving minors, or otherwise harmful content.</li>
        <li>Generate content that impersonates real people or brands without permission.</li>
        <li>Scrape, reverse engineer, or extract our prompts, models, or proprietary logic.</li>
        <li>Resell or sublicense the Service or Generated Content as a competing AI service.</li>
        <li>Circumvent quota or rate limits, including by creating multiple accounts.</li>
        <li>Submit content that infringes third-party rights (copyright, trademark, privacy).</li>
        <li>Use the Service for spam, phishing, malware distribution, or to run any unlawful activity.</li>
      </ul>
      <p>Violations may result in immediate suspension or termination without refund.</p>

      <h2>6. Pricing and billing</h2>
      <ul>
        <li><strong>Free plan:</strong> up to {COMPANY.FREE_GENERATIONS} trial generations per account, no credit card.</li>
        <li><strong>Starter:</strong> $14.99/month — unlimited AI generation and export. <strong>Pro:</strong> $24.99/month — adds full Zenya hosting, a custom domain, SSL, and analytics.</li>
        <li>Both plans are a <strong>monthly subscription that renews automatically</strong> at the end of each billing cycle until you cancel. You can cancel at any time from your dashboard, and your subscription stays active until the end of the current paid cycle.</li>
        <li>Existing customers on the previous one-time plan ($9.99) or the hosting plan ($19.99/month) keep their plan and price unchanged.</li>
        <li>Currency is set by your country: US dollars outside the EEA and the UK, euros within them.</li>
        <li>The displayed price includes VAT where applicable. Stripe Tax calculates any VAT (BTW) or sales tax and shows it on the receipt.</li>
        <li>
          Payments are processed by Stripe. By subscribing you also agree to{' '}
          <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener">Stripe&apos;s terms</a>.
        </li>
        <li>We may change prices for future subscription periods at any time, with advance notice before a renewal affected by the change.</li>
      </ul>

      <h2>7. Refunds and the right of withdrawal</h2>
      <p>
        Full detail: <a href="/en/refund">Refund Policy</a>. In summary: consumers in the EU have a 14-day
        right of withdrawal under Article 6:230o of the Dutch Civil Code. By starting to use the Service
        (including generating a template) you expressly request immediate performance and acknowledge that,
        once a template has been generated using your paid features, the right of withdrawal lapses in
        respect of that performance.
      </p>

      <h2>8. Generated Content — ownership and licence</h2>
      <ul>
        <li>You retain ownership of <strong>your inputs</strong> (descriptions, product data, brand materials).</li>
        <li>To the extent permitted by law, you own the <strong>output</strong> generated for you, and may use it commercially for your own business.</li>
        <li>We retain ownership of the Service, the underlying AI prompts, the templates, the platform code, and the Zenya brand.</li>
        <li>AI-generated content is not copyrightable in every jurisdiction, and we give no warranty of exclusivity. Other users may receive similar output from similar inputs.</li>
        <li>You grant us a worldwide, non-exclusive, royalty-free licence to host, display, and process your inputs and outputs solely for the purpose of providing the Service.</li>
        <li><strong>Dynamic content on Shopify is a licensed service:</strong> when you publish a Shopify-running theme via the Zenya app, the dynamic content Zenya generates and serves (such as product page sections delivered by the Zenya app) remains a <strong>licensed service that requires an active subscription</strong>. If your subscription is cancelled or expires, or the Zenya app is removed from your store, that dynamic content automatically stops appearing, while your underlying store and products remain untouched. You can restore it by reactivating a paid subscription. This does not apply to static export files you have already downloaded, which remain yours.</li>
      </ul>

      <h2>9. Third-party services</h2>
      <p>
        The Service integrates with OpenAI, Stripe, Supabase, Vercel, ScraperAPI, and optionally Shopify.
        Your use of those integrations is governed by their own terms. We are not responsible for their
        availability, content, or conduct. If you connect a Shopify store, you also agree to the Shopify App
        Store and Partner Program agreements.
      </p>

      <h2>10. AI and output disclaimer</h2>
      <p>
        The Service uses large language models, which may produce inaccurate, biased, or fabricated content
        (&quot;hallucinations&quot;). You must review Generated Content for accuracy, legality, and
        suitability before publishing it.{' '}
        <strong>We are not liable for any consequence of using unreviewed generated content</strong>,
        including without limitation factual errors, third-party intellectual property claims, or regulatory
        breaches on your published site.
      </p>

      <h2>11. Service availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. We may carry out
        maintenance, update features, or suspend the Service for security reasons. We are not liable for
        downtime caused by third-party providers (Vercel, Supabase, Stripe, OpenAI, and others) or by force
        majeure events.
      </p>

      <h2>12. Termination</h2>
      <ul>
        <li>You may terminate by deleting your account at any time.</li>
        <li>We may suspend or terminate your account immediately, without refund, for breach of these Terms or of applicable law.</li>
        <li>We may terminate inactive free accounts after 12 months of inactivity (with email notice).</li>
        <li>On termination your access ends. Personal data is handled per the <a href="/en/privacy">Privacy Policy</a>.</li>
      </ul>

      <h2>13. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, the Service is provided &quot;as is&quot; without warranties
        of merchantability, fitness for a particular purpose, or non-infringement. To the maximum extent
        permitted by Dutch law, our total liability for any claim arising out of these Terms or the Service
        is limited to the greater of (a) the fees you paid us in the 12 months preceding the event, or (b)
        EUR 100. We are not liable for any indirect, incidental, consequential, special, or punitive damages,
        including loss of profits or loss of data.
      </p>
      <p>
        Nothing in these Terms limits liability for death or personal injury caused by negligence, for fraud,
        or for any other liability that cannot be excluded under Dutch law.
      </p>

      <h2>14. Indemnity</h2>
      <p>
        You agree to indemnify and hold us harmless from any claim, damage, or expense (including reasonable
        legal fees) arising from (a) your use of the Service, (b) your inputs or published Generated Content,
        (c) your breach of these Terms, or (d) your violation of any law or third-party right.
      </p>

      <h2>15. Changes to the Service or these Terms</h2>
      <p>
        We may modify the Service or these Terms at any time. Material changes will be announced by email to
        registered users at least 30 days before they take effect. Continuing to use the Service after the
        effective date means you accept the changes. If you do not accept them, you may terminate your
        account before they take effect.
      </p>

      <h2>16. Governing law and disputes</h2>
      <p>
        These Terms are governed by Dutch law, excluding its conflict-of-law rules. The UN Convention on
        Contracts for the International Sale of Goods does not apply. Disputes are referred to the exclusive
        jurisdiction of the courts of Amsterdam, the Netherlands, subject to the mandatory right of consumers
        to bring proceedings in their country of residence under EU law.
      </p>
      <p>
        Consumers in the EU may also use the European Commission&apos;s{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">
          Online Dispute Resolution platform
        </a>
        .
      </p>

      <h2>17. Miscellaneous</h2>
      <ul>
        <li><strong>Severability:</strong> if any provision is unenforceable, the remainder stays in force.</li>
        <li><strong>No waiver:</strong> failure to enforce a right is not a waiver of it.</li>
        <li><strong>Assignment:</strong> you may not assign your rights without our consent; we may assign in a merger or acquisition.</li>
        <li><strong>Entire agreement:</strong> these Terms together with the <a href="/en/privacy">Privacy Policy</a>, the <a href="/en/cookies">Cookie Policy</a>, and the <a href="/en/refund">Refund Policy</a> constitute the entire agreement.</li>
      </ul>

      <h2>18. Contact</h2>
      <ul>
        <li>Legal: <a href={`mailto:${COMPANY.LEGAL_EMAIL}`}>{COMPANY.LEGAL_EMAIL}</a></li>
        <li>Support: <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a></li>
        <li>Post: {formatAddress()}</li>
      </ul>

      <hr />
      <p className="text-sm text-muted">
        This is an English translation provided for convenience. The Arabic version at{' '}
        <a href="/terms">zenyaai.co/terms</a> is the authoritative text; if the two differ, the Arabic
        version prevails.
      </p>
    </main>
  )
}
