import { affiliateClickHref, type AffiliatePlacement } from '@/lib/affiliate'

/**
 * "Don't have a Shopify store yet?" CTA card.
 *
 * Lives wherever a user might think "great, I have the ZIP, now what?" —
 * dashboard after a Storefront/Collective download, theme creation flow
 * when an e-commerce template is picked, etc.
 *
 * Includes the FTC-required affiliate disclosure inline (US/EU disclosure
 * laws expect it within the same eyeful as the link).
 */
export default function ShopifyAffiliateCallout({
  placement,
  variant = 'card',
  className = '',
}: {
  placement: AffiliatePlacement
  /** Visual variant — 'card' for dashboards, 'inline' for FAQ / body copy. */
  variant?: 'card' | 'inline' | 'banner'
  className?: string
}) {
  const href = affiliateClickHref(placement)

  if (variant === 'inline') {
    return (
      <span className={className}>
        <a
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          Start a free Shopify trial
        </a>{' '}
        <span className="text-xs text-muted">(affiliate link — we earn a small commission)</span>
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-token bg-white px-4 py-3 ${className}`}
      >
        <div className="text-sm text-foreground">
          <strong>Don&apos;t have a Shopify store yet?</strong>{' '}
          <span className="text-muted">Spin one up free, then upload your Zenya theme.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-muted sm:inline">affiliate link · supports Zenya</span>
          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="rounded-md bg-[#008060] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Start free trial →
          </a>
        </div>
      </div>
    )
  }

  // default: 'card'
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-token bg-elevated p-5 shadow-soft-sm ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(0,128,96,0.10), transparent 60%)',
        }}
      />
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
          style={{ background: '#008060' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18" />
            <path d="M9 21V9" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Don&apos;t have a Shopify store yet?
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Spin up a free trial in two minutes, then upload your Zenya OS 2.0
            theme ZIP from{' '}
            <strong>Online Store → Themes → Add → Upload</strong>. Shopify
            handles the cart, checkout, payments, and inventory — Zenya
            handles the look.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          Affiliate link — Zenya earns a small commission, no extra cost to you.
        </p>
        <a
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="rounded-md bg-[#008060] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
        >
          Start free Shopify trial →
        </a>
      </div>
    </div>
  )
}
