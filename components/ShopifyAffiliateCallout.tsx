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
          ابدأ تجربة Shopify مجانية
        </a>{' '}
        <span className="text-xs text-muted">(رابط تابع — نتقاضى عمولة بسيطة)</span>
      </span>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-token bg-white px-4 py-3 ${className}`}
      >
        <div className="text-sm text-foreground">
          <strong>ألا تملك متجر Shopify بعد؟</strong>{' '}
          <span className="text-muted">أنشئ واحدًا مجانًا، ثم ارفع قالب زينيا.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-muted sm:inline">رابط تابع · يدعم زينيا</span>
          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="rounded-md bg-[#008060] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            ابدأ تجربة مجانية ←
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
            ألا تملك متجر Shopify بعد؟
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            أنشئ تجربة مجانية خلال دقيقتين، ثم ارفع ملف قالب زينيا بصيغة OS 2.0
            من{' '}
            <strong>المتجر الإلكتروني ← القوالب ← إضافة ← رفع</strong>. يتولّى Shopify
            السلّة والدفع والمدفوعات والمخزون — وتتولّى زينيا المظهر.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          رابط تابع — تتقاضى زينيا عمولة بسيطة، دون أي تكلفة إضافية عليك.
        </p>
        <a
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="rounded-md bg-[#008060] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
        >
          ابدأ تجربة Shopify مجانية ←
        </a>
      </div>
    </div>
  )
}
