import './globals.css'
import { ReactNode } from 'react'
import type { Metadata } from 'next'
import SmoothScroll from '@/components/marketing/SmoothScroll'
import CookieConsent from '@/components/CookieConsent'

const SITE_URL = 'https://zenyaai.co'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Zenya — AI Website Generator. Every Template. Live in Minutes.',
    template: '%s · Zenya',
  },
  description:
    'Zenya is the AI website generator for every kind of business. Pick from 8 premium templates — restaurants, fashion, SaaS, wellness, services, and more — share a quick brief, and Zenya writes the copy and ships the site in minutes. $9.99 lifetime or $19.99/mo with full hosting.',
  applicationName: 'Zenya',
  generator: 'Zenya',
  keywords: [
    'AI website builder',
    'AI website generator',
    'website builder for small business',
    'restaurant website builder',
    'AI SaaS landing page',
    'wellness studio website',
    'lookbook generator',
    'one product Shopify store',
    'no-code website builder',
    'AI copywriter for websites',
    'launch a website in minutes',
  ],
  authors: [{ name: 'Zenya', url: SITE_URL }],
  creator: 'Zenya',
  publisher: 'Zenya',
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Zenya',
    title: 'Zenya — AI Website Generator. Every Template. Live in Minutes.',
    description:
      '8 premium AI-built website templates for restaurants, fashion, SaaS, wellness, services, and Shopify stores. Brief in → full site out — copy, layout, images, ready to publish.',
    images: [
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'Zenya — AI Website Generator' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenya — AI Website Generator. Every Template. Live in Minutes.',
    description:
      'Brief in → full site out. 8 AI-built templates for every kind of business. $9.99 lifetime or $19.99/mo with hosting.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
}

// JSON-LD: tells Google explicitly what Zenya is — drops the old "one-product
// Shopify generator" snippet that was leaking from the previous description.
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zenya',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'AI website generator for every kind of business. 8 premium templates from restaurants to Shopify stores, live in minutes.',
    foundingDate: '2025',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@zenyaai.co',
      availableLanguage: ['English'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Zenya',
    operatingSystem: 'Web Browser',
    applicationCategory: 'BusinessApplication',
    description:
      'AI-powered website generator. Choose a template, share a brief, get a finished website with copy, layout, and imagery — ready to publish.',
    url: SITE_URL,
    offers: [
      {
        '@type': 'Offer',
        name: 'Pro Lifetime',
        price: '9.99',
        priceCurrency: 'USD',
        description: 'One-time purchase. Unlimited AI generations + Shopify export + project ZIP.',
      },
      {
        '@type': 'Offer',
        name: 'Pro Hosting',
        price: '19.99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '19.99',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
          unitText: 'MONTH',
        },
        description:
          'Monthly subscription. Zenya hosts your brochure sites, plus custom domain, SSL, and analytics. Includes everything in Pro Lifetime.',
      },
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: '3 AI generations to try Zenya. All 8 templates available.',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2400',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zenya',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/themes?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <SmoothScroll />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
