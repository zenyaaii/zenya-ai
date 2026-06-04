import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `Refund Policy — ${COMPANY.BRAND_NAME}`,
  description: `When and how you can request a refund for your ${COMPANY.PRODUCT_NAME} one-time purchase.`,
  alternates: { canonical: '/refund' },
}

export default function RefundPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Refund Policy</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        {COMPANY.PRODUCT_NAME} Pro is a <strong>one-time purchase</strong> ({COMPANY.PRICE_DISPLAY}).
        There is no subscription, no auto-renewal, and no recurring charge. This policy
        explains your refund rights. It complements (and does not override) your
        mandatory rights under EU and Dutch consumer law.
      </p>

      <h2>1. 14-day money-back guarantee</h2>
      <p>
        If {COMPANY.PRODUCT_NAME} Pro doesn&rsquo;t work for you, email us within{' '}
        <strong>14 days</strong> of purchase and we&rsquo;ll refund the full amount —
        no questions asked. The refund covers the price plus any VAT collected.
      </p>

      <h2>2. EU 14-day right of withdrawal</h2>
      <p>
        Consumers in the EU/EEA have a 14-day right of withdrawal under Article
        6:230o of the Dutch Civil Code, transposing Directive 2011/83/EU.
      </p>
      <p>
        <strong>Important exception:</strong> When you check the &ldquo;I consent
        to immediate access&rdquo; box at signup, you expressly request immediate
        performance and waive your withdrawal right for any digital content
        already delivered to you. In practice this means: any theme you have
        generated using Pro is non-refundable. Our voluntary 14-day money-back
        guarantee above is more generous than the statutory minimum.
      </p>

      <h2>3. After 14 days</h2>
      <p>
        Outside the 14-day window, refunds are issued only in these situations:
      </p>
      <ul>
        <li><strong>Service outage:</strong> if the Service is substantially unavailable for &gt;48 hours due to our fault, we&rsquo;ll issue a partial or full refund on request.</li>
        <li><strong>Billing error:</strong> any double-charge or amount error is refunded immediately upon verification.</li>
      </ul>
      <p>
        We do <strong>not</strong> refund purchases where the Service was used
        (themes generated, store published, ZIPs downloaded) after the 14-day
        window unless one of the conditions above applies.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Email{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>{' '}
        with subject &ldquo;Refund request&rdquo; and include:
      </p>
      <ul>
        <li>Account email</li>
        <li>Date of the charge you want refunded</li>
        <li>Reason for the request (optional within 14 days)</li>
      </ul>
      <p>
        We respond within 5 business days. Approved refunds are issued via
        Stripe to your original payment method and typically appear in 5-10
        business days depending on your bank.
      </p>

      <h2>5. Chargebacks</h2>
      <p>
        Please contact us before initiating a chargeback with your bank — we
        almost always resolve disputes faster and more fairly directly.
        Unsubstantiated chargebacks may result in account termination.
      </p>

      <h2>6. Contact</h2>
      <p>
        Billing &amp; refunds:{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>
      </p>
    </main>
  )
}
