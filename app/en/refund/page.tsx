import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

const SITE = 'https://zenyaai.co'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'How to cancel your Zenya subscription, your EU 14-day right of withdrawal, when refunds are issued on monthly renewals, and how to request one.',
  alternates: {
    canonical: `${SITE}/en/refund`,
    languages: { en: `${SITE}/en/refund`, ar: `${SITE}/refund`, 'x-default': `${SITE}/refund` },
  },
  openGraph: {
    title: 'Zenya cancellation and refund policy',
    description: 'Cancel anytime, the EU 14-day withdrawal right, and when refunds are issued.',
    url: `${SITE}/en/refund`,
    type: 'website',
    locale: 'en_US',
  },
}

export default function EnRefundPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>Cancellation &amp; Refund Policy</h1>
      <p className="text-sm text-muted">Last updated: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        Zenya AI is sold as a <strong>monthly subscription</strong>: Starter at $14.99 per month and Pro at
        $24.99 per month. The subscription renews automatically each month until you cancel it. There is also
        a free plan giving you <strong>{COMPANY.FREE_GENERATIONS} generations</strong> to try, with no card
        required.
      </p>
      <p>
        This policy explains your cancellation and refund rights. It supplements, and does not override, your
        mandatory rights under EU and Dutch consumer law.
      </p>

      <h2>1. Cancel at any time</h2>
      <p>
        You can cancel your subscription at any time from your dashboard, with no cancellation fee and
        without needing to email us. When you cancel:
      </p>
      <ul>
        <li>Your subscription <strong>stays active until the end of the current paid period</strong>, and nothing further is charged after that.</li>
        <li>The templates and exports you created remain in your account.</li>
        <li>On Pro, your hosted site stays live until the end of the paid period, after which publishing stops.</li>
      </ul>
      <p>
        Cancelling is the primary way to stop being charged. Refunds are governed by the sections below.
      </p>

      <h2>2. The EU 14-day right of withdrawal</h2>
      <p>
        Consumers in the EU/EEA have a 14-day right of withdrawal under Article 6:230o of the Dutch Civil
        Code, implementing Directive 2011/83/EU. This right applies to your{' '}
        <strong>first subscription payment</strong>.
      </p>
      <p>
        <strong>Important exception:</strong> when you tick the &quot;I agree to immediate access&quot; box at
        signup, you expressly request that the service begin immediately and you waive your right of
        withdrawal for digital content already delivered to you. In practice this means: if you generate a
        template or publish a site during those 14 days, that consumed part of the service is not
        refundable.
      </p>
      <p>
        If you have not used the service during the first 14 days of your first subscription, write to us and
        we will refund the first payment in full, including any VAT collected.
      </p>

      <h2>3. Monthly renewals</h2>
      <p>
        After the first month, no automatic refund is issued for the current period, since you can avoid any
        upcoming charge by cancelling before the renewal date. We do issue refunds in these cases:
      </p>
      <ul>
        <li><strong>Service outage:</strong> if the service is materially unavailable for more than 48 hours due to a fault on our side, we issue a partial or full refund for the affected period on request.</li>
        <li><strong>Billing error:</strong> any double charge, incorrect amount, or charge after cancellation is refunded immediately on verification.</li>
        <li><strong>Unintended renewal:</strong> if your subscription renewed and you did not use the service at all during that period, write to us within 7 days of the charge and we will consider the request in good faith.</li>
      </ul>

      <h2>4. Previous one-time purchases</h2>
      <p>
        Customers who bought Zenya AI as a one-time purchase before{' '}
        <strong>{COMPANY.SUBSCRIPTION_SINCE}</strong> keep what they paid for. They are not automatically
        converted to a subscription and are not charged any recurring fee. The refund terms that applied at
        the time of their purchase continue to apply to them.
      </p>

      <h2>5. How to request a refund</h2>
      <p>
        Write to <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a> with the subject
        &quot;Refund request&quot; and include:
      </p>
      <ul>
        <li>The account email address</li>
        <li>The date of the charge you want refunded</li>
        <li>The reason for the request (optional within the 14-day window)</li>
      </ul>
      <p>
        We reply within 5 business days. Approved refunds are issued via Stripe to the original payment
        method and usually appear within 5 to 10 business days, depending on your bank.
      </p>

      <h2>6. Chargebacks</h2>
      <p>
        Please contact us before starting a chargeback through your bank. We almost always resolve disputes
        faster and more fairly directly. Unjustified chargebacks may result in account termination.
      </p>

      <h2>7. Contact</h2>
      <p>
        Billing and refunds: <a href={`mailto:${COMPANY.SUPPORT_EMAIL}`}>{COMPANY.SUPPORT_EMAIL}</a>
      </p>

      <hr />
      <p className="text-sm text-muted">
        This is an English translation provided for convenience. The Arabic version at{' '}
        <a href="/refund">zenyaai.co/refund</a> is the authoritative text; if the two differ, the Arabic
        version prevails.
      </p>
    </main>
  )
}
