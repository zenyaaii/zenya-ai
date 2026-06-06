'use client'

import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'

export default function SeoPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">SEO</h1>
        <p className="mt-1 text-[13px] text-muted">
          Page titles, meta descriptions, Open Graph cards, sitemap. Per site.
        </p>
      </header>

      <ComingSoon />

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="What's already working" tint="#15803d">
          <Bullet>Auto-generated meta title + description from your site content</Bullet>
          <Bullet>OpenGraph + Twitter card from your hero image</Bullet>
          <Bullet>Structured data (LocalBusiness, Organization)</Bullet>
          <Bullet>Sitemap.xml + robots.txt auto-served per published site</Bullet>
        </Card>
        <Card title="Coming soon" tint="#5e6ad2">
          <Bullet>Edit page title + meta description per site</Bullet>
          <Bullet>Custom OG image upload + per-page override</Bullet>
          <Bullet>Google Search Console verification field</Bullet>
          <Bullet>Sitemap ping on publish</Bullet>
          <Bullet>Schema.org markup overrides (hours, menu, prices)</Bullet>
        </Card>
      </section>

      <div className="mt-8 rounded-2xl border border-token bg-white p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Today's checklist</h2>
        <p className="mt-1 text-[13px] text-muted">
          Until per-site SEO edits land, these are the most-leveraged things you can do today:
        </p>
        <ol className="mt-4 space-y-3 text-[13px]">
          <Step n={1} title="Submit your sitemap to Google Search Console">
            Add your domain at <Link href="https://search.google.com/search-console" target="_blank" className="text-primary hover:underline">search.google.com/search-console</Link>, verify, then submit{' '}
            <code className="rounded bg-surface px-1 py-0.5 text-[12px]">https://yourdomain.com/sitemap.xml</code>.
          </Step>
          <Step n={2} title="Confirm your hero image looks good when shared">
            Paste your live URL into <Link href="https://opengraph.xyz" target="_blank" className="text-primary hover:underline">opengraph.xyz</Link> to preview how it'll look when shared on Slack / WhatsApp / iMessage.
          </Step>
          <Step n={3} title="Write a clear, location-specific hero subhead">
            "Modern French dining in the West Village" ranks better than "A truly extraordinary experience." The editor lets you do this without regenerating.
          </Step>
        </ol>
      </div>
    </div>
  )
}

function ComingSoon() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-token bg-white p-6"
      style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(94,106,210,0.06), transparent 70%)' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
             style={{ background: 'white', boxShadow: '0 4px 16px -8px rgba(94,106,210,0.40), 0 0 0 1px rgba(94,106,210,0.20) inset' }}>
          <Search className="h-5 w-5 text-primary" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Per-site SEO controls — landing soon</h2>
          <p className="mt-1 text-[13px] leading-[1.55] text-muted">
            Every site you publish on Zenya already ships with auto-generated metadata, OpenGraph cards,
            structured data, and a sitemap — Google sees you. This page will let you override the auto-generated
            text per site (title, description, OG image) when you want full control.
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ title, tint, children }: { title: string; tint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint }}>
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-[13px] leading-[1.55]">{children}</ul>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-foreground">
      <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted" />
      <span>{children}</span>
    </li>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-[10.5px] font-bold text-white">
        {n}
      </span>
      <div className="flex-1">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="mt-0.5 text-muted leading-[1.6]">{children}</div>
      </div>
    </li>
  )
}
