import type { Metadata } from 'next'
import { hreflangAlternates } from '@/lib/i18n/config'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Pricing — Starter $14.99/mo or Pro $24.99/mo with hosting',
  description:
    'Free to try (2 generations). Starter $14.99/month for unlimited AI generations + Shopify export + project ZIP. Pro $24.99/month adds Zenya hosting, custom domain, SSL, and analytics. Cancel anytime. VAT-inclusive prices for EU customers.',
  alternates: {
    canonical: '/pricing',
    languages: hreflangAlternates('https://zenyaai.co/pricing', 'https://zenyaai.co/en/pricing'),
  },
  openGraph: {
    title: 'Zenya pricing — Starter $14.99/mo or Pro $24.99/mo with hosting',
    description:
      'Starter at $14.99/month for the full generator, or Pro at $24.99/month for full Zenya hosting. Cancel anytime. Free tier always available.',
    url: 'https://zenyaai.co/pricing',
  },
}

const PRICING_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What’s the difference between Starter and Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Starter ($14.99/month) unlocks unlimited AI generations and exports — for the two e-commerce templates (Storefront, Collective) you connect or upload to your Shopify store; for the other templates you download the project ZIP and host wherever you like. Pro ($24.99/month) adds Zenya hosting for the brochure templates (live URL, custom domain, no Zenya badge) plus everything in Starter.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my subscription?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes, any time from your dashboard. Your plan stays active until the end of the current billing period, then it won’t renew. Themes and exports you have generated stay in your account.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does Zenya hosting include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'A live site at your-slug.zenyaai.co for any brochure template (Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison), one connected custom domain, automatic SSL, fast CDN delivery, and removal of the Made with Zenya footer. E-commerce templates (Storefront, Collective) are not Zenya-hosted — they go to Shopify.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I switch between Starter and Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Upgrading from Starter to Pro takes effect immediately from your dashboard. To move back down, cancel Pro and start a Starter subscription — hosted sites stay live until the end of the current billing period.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer a refund policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'No automatic refund on the current billing period, but you can cancel any time before renewal to avoid the next charge. Contact us if you run into a billing issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which templates work where?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Two e-commerce templates — Storefront and Collective — export as ready Shopify themes and run on Shopify. The other six templates (Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison) are brochure sites that Zenya can host directly on the Pro plan.',
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
