import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `Refund & Cancellation Policy — ${COMPANY.BRAND_NAME}`,
  description: `When and how you can cancel your ${COMPANY.PRODUCT_NAME} subscription and request a refund.`,
  alternates: { canonical: '/refund' },
}

export default function RefundPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Refund &amp; Cancellation Policy</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        This policy explains your rights to cancel your {COMPANY.PRODUCT_NAME}{' '}
        subscription and request a refund. It complements (and does not
        override) your mandatory rights under EU and Dutch consumer law.
      </p>

      <h2>1. The {COMPANY.TRIAL_DAYS}-day free trial</h2>
      <p>
        Every new Pro subscription starts with a <strong>{COMPANY.TRIAL_DAYS}-day
        free trial</strong>. You will <strong>not be charged</strong> during
        the trial. You can cancel any time during the trial from your account
        and you will not pay anything. The first charge happens on day {COMPANY.TRIAL_DAYS + 1}{' '}
        unless you cancel.
      </p>

      <h2>2. Cancelling your subscription</h2>
      <ul>
        <li>Sign in, go to <a href="/settings">Settings</a>, click &ldquo;Manage subscription&rdquo;.</li>
        <li>You&rsquo;ll be redirected to the secure Stripe customer portal where you can cancel in one click.</li>
        <li>Alternatively, email{' '}
          <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>{' '}
          with subject &ldquo;Cancel subscription&rdquo;.</li>
        <li>Cancellation takes effect <strong>at the end of the current billing period</strong>. You retain Pro access until then.</li>
      </ul>

      <h2>3. EU 14-day right of withdrawal</h2>
      <p>
        Consumers in the EU/EEA have a 14-day right of withdrawal under
        Article 6:230o of the Dutch Civil Code, transposing Directive
        2011/83/EU. This means you can normally cancel a paid digital
        service within 14 days of purchase for a full refund.
      </p>
      <p>
        <strong>Important exception:</strong> When you check the box{' '}
        &ldquo;I want immediate access&rdquo; (and you do, by starting your
        trial / generating themes), you expressly request immediate
        performance and waive your withdrawal right for any digital content
        that has already been delivered to you. Specifically, you lose the
        withdrawal right in respect of any theme you have already generated
        using the Pro plan.
      </p>
      <p>
        If you change your mind <em>before</em> using any Pro feature,
        contact us within 14 days for a full refund.
      </p>

      <h2>4. Refund eligibility (outside the 14-day window)</h2>
      <p>
        Outside of the statutory withdrawal right, refunds are issued only
        in these situations:
      </p>
      <ul>
        <li><strong>Accidental renewal:</strong> if you forgot to cancel and didn&rsquo;t use the Service in the new billing period, we&rsquo;ll refund that period if you ask within 7 days of the charge.</li>
        <li><strong>Service outage:</strong> if the Service was substantially unavailable for &gt;48 hours in a billing period due to our fault, we&rsquo;ll pro-rate a refund for the affected days.</li>
        <li><strong>Billing error:</strong> any double-charge or amount error is refunded immediately upon verification.</li>
      </ul>
      <p>
        We do <strong>not</strong> refund:
      </p>
      <ul>
        <li>Partial unused months after voluntary cancellation (your access continues until end of period instead).</li>
        <li>Charges for which the Service was used (themes generated, store published).</li>
        <li>Subscriptions cancelled more than 7 days after the most recent renewal.</li>
      </ul>

      <h2>5. How to request a refund</h2>
      <p>
        Email{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>{' '}
        with subject &ldquo;Refund request&rdquo; and include:
      </p>
      <ul>
        <li>Account email</li>
        <li>Date of the charge you want refunded</li>
        <li>Reason for the request</li>
      </ul>
      <p>
        We respond within 5 business days. Approved refunds are issued via
        Stripe to your original payment method and typically appear in 5-10
        business days depending on your bank.
      </p>

      <h2>6. Chargebacks</h2>
      <p>
        Please contact us before initiating a chargeback with your bank — we
        almost always resolve disputes faster and more fairly directly.
        Unsubstantiated chargebacks may result in account termination.
      </p>

      <h2>7. Contact</h2>
      <p>
        Billing &amp; refunds:{' '}
        <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>
      </p>
    </main>
  )
}
