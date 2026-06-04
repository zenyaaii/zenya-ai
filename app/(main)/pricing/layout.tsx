import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Pricing — $9.99 lifetime or $19.99/mo with hosting',
  description:
    'Free to try (3 generations). $9.99 one-time for unlimited AI generations + Shopify export + project ZIP. $19.99/month adds Zenya hosting, custom domain, SSL, and analytics. VAT-inclusive prices for EU customers.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Zenya pricing — $9.99 lifetime or $19.99/mo with hosting',
    description:
      'Pay $9.99 once and own the generator forever, or $19.99/month for full Zenya hosting. Free tier always available.',
    url: 'https://zenyaai.co/pricing',
  },
}

const PRICING_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What’s the difference between the one-time plan and the hosting plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'The one-time $9.99 unlocks unlimited AI generations and exports — for the two e-commerce templates (Storefront, Collective) you connect or upload to your Shopify store; for the other templates you download the project ZIP and host wherever you like. The $19.99/month hosting plan adds Zenya hosting for the brochure templates (live URL, custom domain, no Zenya badge) plus everything in the one-time plan, billed monthly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the one-time payment really one-time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Pay $9.99 (or €9.99 in Europe, VAT included) once and the generator is yours for life. No renewal. Lifetime access to unlimited AI generations and exports.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does Zenya hosting include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'A live site at zenya.app/s/your-slug for any brochure template (Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison), one connected custom domain, automatic SSL, fast CDN delivery, and removal of the Made with Zenya footer. E-commerce templates (Storefront, Collective) are not Zenya-hosted — they go to Shopify.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel the hosting plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes, any time from your dashboard. Hosting stays active until the end of the current billing month, then your site stops resolving. Themes and exports you have generated stay in your account.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer a refund policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          '14-day money-back guarantee on the one-time plan, and you can cancel the hosting plan at any time. See the full Refund Policy for details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which templates work where?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Two e-commerce templates — Storefront and Collective — export as Shopify OS 2.0 themes and run on Shopify. The other six templates (Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison) are brochure sites that Zenya can host directly.',
      },
    },
  ],
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_FAQ_SCHEMA) }}
      />
      {children}
    </>
  )
}
