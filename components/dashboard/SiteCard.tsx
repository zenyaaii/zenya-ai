'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Globe,
  MoreHorizontal,
  Download,
  Eye,
  Edit3,
  Trash2,
  Lock,
  ShoppingBag,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  type LucideIcon,
} from 'lucide-react'
import DomainsList from '@/components/DomainsList'

export type SiteTheme = {
  id: string
  product_name: string
  created_at: string
  slug?: string | null
  is_published?: boolean
  template_type?: string | null
  content?: any
  view_count?: number | null
}

export const HOSTABLE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])
export const SHOPIFY_TYPES = new Set(['one_product', 'storefront', 'collective'])

const TEMPLATE_ICON: Record<string, LucideIcon> = {
  one_product: ShoppingBag,
  storefront:  ShoppingBag,
  collective:  Store,
  restaurant:  Utensils,
  atlas:       LayoutDashboard,
  lookbook:    Shirt,
  studio:      Feather,
  services:    Wrench,
  wellness:    Leaf,
}

const TEMPLATE_LABEL: Record<string, string> = {
  one_product: 'Storefront · Shopify',
  storefront:  'Storefront · Shopify',
  collective:  'Collective · Shopify',
  restaurant:  'Maison · Restaurant',
  atlas:       'Atlas · SaaS',
  lookbook:    'Lookbook · Fashion',
  studio:      'Studio · Brand',
  services:    'Trade · Services',
  wellness:    'Wellness · Spa',
}

const TEMPLATE_TINT: Record<string, { bg: string; ring: string; fg: string }> = {
  one_product: { bg: 'rgba(94,106,210,0.10)',  ring: 'rgba(94,106,210,0.30)',  fg: '#5e6ad2' },
  storefront:  { bg: 'rgba(94,106,210,0.10)',  ring: 'rgba(94,106,210,0.30)',  fg: '#5e6ad2' },
  collective:  { bg: 'rgba(5,150,105,0.10)',   ring: 'rgba(5,150,105,0.30)',   fg: '#059669' },
  restaurant:  { bg: 'rgba(200,169,106,0.14)', ring: 'rgba(200,169,106,0.35)', fg: '#9b6f00' },
  atlas:       { bg: 'rgba(67,56,202,0.10)',   ring: 'rgba(67,56,202,0.28)',   fg: '#4338ca' },
  lookbook:    { bg: 'rgba(190,18,60,0.10)',   ring: 'rgba(190,18,60,0.28)',   fg: '#be123c' },
  studio:      { bg: 'rgba(28,28,28,0.06)',    ring: 'rgba(28,28,28,0.20)',    fg: '#1c1c1c' },
  services:    { bg: 'rgba(194,65,12,0.10)',   ring: 'rgba(194,65,12,0.30)',   fg: '#c2410c' },
  wellness:    { bg: 'rgba(21,128,61,0.10)',   ring: 'rgba(21,128,61,0.30)',   fg: '#15803d' },
}

export default function SiteCard({
  theme,
  hasHosting,
  isPro,
  onPublish,
  onAddDomain,
  onUnpublish,
}: {
  theme: SiteTheme
  hasHosting: boolean
  /** any pro entitlement (lifetime OR hosting OR admin) */
  isPro: boolean
  onPublish: () => void
  onAddDomain: () => void
  onUnpublish: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    'one_product'

  const isHostable = HOSTABLE_TYPES.has(businessType)
  const isEcom = SHOPIFY_TYPES.has(businessType)
  const publishedHere = isHostable && !!theme.is_published && !!theme.slug

  const Icon = TEMPLATE_ICON[businessType] || ShoppingBag
  const label = TEMPLATE_LABEL[businessType] || businessType
  const tint = TEMPLATE_TINT[businessType] || TEMPLATE_TINT.one_product

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 0 #f0ede6, 0 8px 24px -16px rgba(28,28,28,0.10)' }}
    >
      {/* Top — visual + status overlay */}
      <div
        className="relative flex aspect-[16/9] items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tint.bg} 0%, white 80%)`,
        }}
      >
        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(28,28,28,0.08) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            maskImage: 'radial-gradient(circle at 50% 60%, black, transparent 75%)',
          }}
        />

        {/* Icon medallion */}
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{
            background: 'white',
            color: tint.fg,
            boxShadow: `0 8px 24px -8px ${tint.ring}, 0 0 0 1px ${tint.ring} inset`,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>

        {/* Status pill — top right */}
        <div className="absolute right-3 top-3">
          <StatusPill
            isPublished={!!publishedHere}
            isDraft={!publishedHere && isHostable}
            isEcom={isEcom}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <h3 className="line-clamp-1 text-[16px] font-semibold tracking-tight text-foreground">
            {theme.product_name || 'Untitled site'}
          </h3>
          <p className="mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
        </div>

        {/* URL block */}
        {publishedHere && (
          <a
            href={`/s/${theme.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[#15803d]/[0.06] px-2 py-1 text-[12px] font-medium text-[#15803d] transition hover:bg-[#15803d]/[0.10]"
          >
            <Globe className="h-3 w-3" strokeWidth={2.5} />
            zenyaai.co/s/{theme.slug}
            <ExternalLink className="h-2.5 w-2.5 opacity-70" strokeWidth={2.5} />
          </a>
        )}
        {!publishedHere && isHostable && (
          <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[rgba(217,119,6,0.08)] px-2 py-1 text-[12px] font-medium text-[#b45309]">
            Draft · not live yet
          </div>
        )}
        {isEcom && (
          <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[rgba(94,106,210,0.08)] px-2 py-1 text-[12px] font-medium text-primary">
            Ships to Shopify
          </div>
        )}

        {/* Inline domains list — only when hosting + published here */}
        {publishedHere && hasHosting && (
          <DomainsList themeId={theme.id} />
        )}

        {/* Locked upsell for hostable + Pro Lifetime (not hosting) */}
        {isHostable && !hasHosting && isPro && !publishedHere && (
          <div className="mb-3 rounded-lg border border-token bg-surface px-3 py-2.5 text-[12.5px]">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" strokeWidth={2} />
              <div>
                <div className="font-medium text-foreground">Hosting plan unlocks publishing</div>
                <Link href="/checkout?plan=hosting" className="text-primary hover:underline">
                  Add hosting · $19.99/mo →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Action row — sticks to bottom */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={`/preview/${theme.id}`}
            className="rounded-md border border-token bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-black/5"
          >
            <Eye className="mr-1 inline-block h-3 w-3" strokeWidth={2.25} />
            Preview
          </Link>

          {/* Hostable primary action */}
          {isHostable && (
            publishedHere ? (
              hasHosting ? (
                <button
                  onClick={onAddDomain}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <Globe className="h-3 w-3" strokeWidth={2.5} />
                  Add domain
                </button>
              ) : null
            ) : (
              hasHosting ? (
                <button
                  onClick={onPublish}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Publish to Zenya
                </button>
              ) : (
                <Link
                  href="/checkout?plan=hosting"
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Upgrade to publish
                </Link>
              )
            )
          )}

          {/* E-com primary — ZIP download */}
          {isEcom && isPro && (
            <a
              href={`/api/themes/${theme.id}/export-shopify`}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Download className="h-3 w-3" strokeWidth={2.5} />
              Download Shopify ZIP
            </a>
          )}
          {isEcom && !isPro && (
            <Link
              href="/checkout?plan=onetime"
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
            >
              Upgrade for ZIP
            </Link>
          )}

          {/* Overflow menu — for unpublish + edit (TODO: delete) */}
          {publishedHere && (
            <div className="relative ml-auto">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-md border border-token p-1.5 text-muted hover:bg-black/5"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-token bg-white p-1 shadow-lg"
                      style={{ boxShadow: '0 8px 24px rgba(28,28,28,0.10), 0 0 0 1px #e5e2d9' }}
                    >
                      <Link
                        href={`/preview/${theme.id}`}
                        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] text-muted hover:bg-black/5 hover:text-foreground"
                      >
                        <Edit3 className="h-3 w-3" strokeWidth={2.25} />
                        Edit theme
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); onUnpublish() }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] text-muted hover:bg-black/5 hover:text-foreground"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                        Unpublish
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------------- StatusPill ---------------------------------- */

function StatusPill({
  isPublished,
  isDraft,
  isEcom,
}: {
  isPublished: boolean
  isDraft: boolean
  isEcom: boolean
}) {
  if (isPublished) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{
          background: 'rgba(21,128,61,0.10)',
          color: '#15803d',
          border: '1px solid rgba(21,128,61,0.20)',
        }}
      >
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803d]" />
        Live
      </span>
    )
  }
  if (isEcom) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{
          background: 'rgba(94,106,210,0.10)',
          color: '#5e6ad2',
          border: '1px solid rgba(94,106,210,0.20)',
        }}
      >
        Shopify
      </span>
    )
  }
  if (isDraft) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{
          background: 'rgba(217,119,6,0.10)',
          color: '#b45309',
          border: '1px solid rgba(217,119,6,0.20)',
        }}
      >
        Draft
      </span>
    )
  }
  return null
}
