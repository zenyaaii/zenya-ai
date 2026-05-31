import './globals.css'
import { ReactNode } from 'react'
import type { Metadata } from 'next'
import SmoothScroll from '@/components/marketing/SmoothScroll'
import CookieConsent from '@/components/CookieConsent'

export const metadata: Metadata = {
  metadataBase: new URL('https://zenyaai.co'),
  title: 'Zenya — AI Website Generator for Every Business',
  description:
    'Build a complete website in under a minute. Restaurants, fashion lookbooks, SaaS landing pages, brand stories, wellness studios, catalog stores, local services, and one-product Shopify stores — 8 AI-written templates ready to go live.',
  keywords: [
    'AI website builder',
    'restaurant website generator',
    'Shopify theme generator',
    'AI landing page',
    'SaaS landing page builder',
    'lookbook generator',
    'wellness studio website',
    'local services website',
  ],
  openGraph: {
    title: 'Zenya — AI Website Generator for Every Business',
    description:
      '8 premium AI-built website templates. From restaurants to SaaS to one-product Shopify stores — go from brief to live site in minutes.',
    type: 'website',
    siteName: 'Zenya',
    url: 'https://zenyaai.co',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenya — AI Website Generator',
    description:
      '8 premium AI-built website templates. Brief in, live site out — minutes, not weeks.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <SmoothScroll />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
