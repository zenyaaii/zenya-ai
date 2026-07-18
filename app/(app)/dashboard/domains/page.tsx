'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Globe, Plus, ExternalLink, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Trash2, Lock, Search, ArrowRight,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import AddDomainModal from '@/components/AddDomainModal'
import {
  priceDomainFor,
  isProProfile,
  PRO_DOMAIN_DISCOUNT_PCT,
  type ProfileForEntitlement,
} from '@/lib/domain-entitlement'
import { publicSiteUrl, publicSiteHost } from '@/lib/portal-urls'
import { useNotify } from '@/components/ui/Notify'

type DomainRow = {
  id: string
  domain: string
  theme_id: string
  status: 'pending_dns' | 'pending_ssl' | 'live' | 'error' | 'removed'
  verified_at: string | null
  last_checked_at: string | null
  error_message: string | null
  is_primary: boolean
  created_at: string
}

type Theme = {
  id: string
  product_name: string
  slug?: string | null
  is_published?: boolean
}

type DomainPurchase = {
  id: string
  domain: string
  status: 'pending_payment' | 'paid' | 'registering' | 'active' | 'failed' | 'refunded'
  years: number
  expires_at: string | null
  retail_usd_charged: number | null
  theme_id: string | null
  created_at: string
}

type SearchResult = {
  domain: string
  /** true = available, false = registered, null = unchecked OR lookup failed. */
  available: boolean | null
  /** True once we've attempted a Porkbun checkDomain for this row.
   *  null+checked=false → row shows a "Check" button.
   *  null+checked=true  → row shows the failure reason. */
  checked: boolean
  premium?: boolean
  /** Wholesale first-year USD price from Porkbun (informational; we charge retail). */
  wholesale_usd_year?: number | null
  /** Wholesale renewal USD/year — shown so users see year-2+ cost upfront. */
  renewal_wholesale_usd_year?: number | null
  /** Retail USD/year — wholesale + our markup. This is what we charge. */
  retail_usd_year?: number | null
  first_year_promo?: boolean
  message?: string
  error_code?: string
  retry_after_seconds?: number
}

const STATUS: Record<DomainRow['status'], {
  label: string; tint: string; ring: string; fg: string; icon: typeof Globe
}> = {
  pending_dns: { label: 'بانتظار DNS', tint: 'rgba(217,119,6,0.10)', ring: 'rgba(217,119,6,0.30)', fg: '#b45309', icon: Clock },
  pending_ssl: { label: 'جارٍ إصدار SSL…',  tint: 'rgba(94,106,210,0.10)', ring: 'rgba(94,106,210,0.30)', fg: '#5e6ad2', icon: Clock },
  live:        { label: 'منشور · SSL مفعّل',  tint: 'rgba(21,128,61,0.10)',  ring: 'rgba(21,128,61,0.30)',  fg: '#15803d', icon: CheckCircle2 },
  error:       { label: 'خطأ',          tint: 'rgba(220,38,38,0.10)',  ring: 'rgba(220,38,38,0.30)',  fg: '#b91c1c', icon: AlertCircle },
  removed:     { label: 'مُزال',        tint: 'rgba(0,0,0,0.05)',      ring: 'rgba(0,0,0,0.15)',      fg: '#6b6b6b', icon: Trash2 },
}

export default function DomainsPage() {
  const supabase = createClient()
  const { confirm, toast } = useNotify()
  const [hasHosting, setHasHosting] = useState(false)
  const [hostingChecked, setHostingChecked] = useState(false)
  /** Profile fields used to preview the free/discounted domain price.
   *  The real price is always re-decided server-side at checkout. */
  const [entitlement, setEntitlement] = useState<ProfileForEntitlement | null>(null)
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [themes, setThemes] = useState<Record<string, Theme>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null) // theme_id to add for

  // Domain-availability search
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  /** Which theme to attach the purchased domain to. Empty = "decide later". */
  const [buyForThemeId, setBuyForThemeId] = useState<string>('')
  const [buying, setBuying] = useState<string | null>(null) // domain string mid-checkout
  const [renewing, setRenewing] = useState<string | null>(null) // purchase_id mid-checkout
  /** Domain currently mid-check (server call in flight). */
  const [checking, setChecking] = useState<string | null>(null)
  /** True while the auto-check loop is walking the unchecked rows. Rows
   *  ahead of the cursor render as "Waiting" instead of "Not checked". */
  const [autoChecking, setAutoChecking] = useState(false)
  /** Generation counter — bumped to cancel any in-flight auto-check
   *  loop (e.g. when the user fires a new search). */
  const checkGenRef = useRef(0)
  /** How many milliseconds to wait between sequential checks. Porkbun
   *  enforces 1 checkDomain call per 10 seconds. Add a hair of buffer. */
  const RATE_WINDOW_MS = 10_500
  /** Lookup: domain string → domain_purchases row owned by current user. */
  const [purchases, setPurchases] = useState<Record<string, DomainPurchase>>({})

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, domainsRes, themesRes, purchasesRes] = await Promise.all([
      supabase.from('profiles').select('plan, has_hosting, is_pro, free_domain_claimed_at').eq('id', user.id).maybeSingle(),
      fetch('/api/domains').then((r) => (r.ok ? r.json() : { domains: [] })),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })),
      fetch('/api/domains/purchase').then((r) => (r.ok ? r.json() : { purchases: [] })),
    ])

    const profile = profileRes.data as any
    setHasHosting(!!profile?.has_hosting || profile?.plan === 'admin')
    setEntitlement(profile || null)
    setHostingChecked(true)
    setDomains(domainsRes.domains || [])
    const map: Record<string, Theme> = {}
    for (const t of (themesRes.themes || [])) map[t.id] = t
    setThemes(map)
    const pmap: Record<string, DomainPurchase> = {}
    for (const p of (purchasesRes.purchases || [])) pmap[(p as DomainPurchase).domain] = p
    setPurchases(pmap)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Auto-poll non-live rows every 15s
  useEffect(() => {
    const hasPending = domains.some((d) => d.status === 'pending_dns' || d.status === 'pending_ssl')
    if (!hasPending) return
    const id = setInterval(async () => {
      for (const d of domains) {
        if (d.status === 'pending_dns' || d.status === 'pending_ssl') {
          try { await fetch(`/api/domains/${d.id}`) } catch {}
        }
      }
      load()
    }, 15_000)
    return () => clearInterval(id)
  }, [domains, load])

  async function recheck(id: string) {
    setBusyId(id)
    try { await fetch(`/api/domains/${id}`); await load() } finally { setBusyId(null) }
  }
  async function remove(id: string, domain: string) {
    const { confirmed } = await confirm({
      title: `فصل ${domain}؟`,
      message: 'سيتوقّف موقعك عن العمل على هذا النطاق.',
      confirmText: 'فصل النطاق',
      tone: 'danger',
    })
    if (!confirmed) return
    setBusyId(id)
    try { await fetch(`/api/domains/${id}`, { method: 'DELETE' }); await load() } finally { setBusyId(null) }
  }

  async function search() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError(null)
    setResults(null)
    // Bumping the generation counter cancels any auto-check loop still
    // running from the previous search — we never want two loops both
    // racing Porkbun's rate limit.
    checkGenRef.current++
    setAutoChecking(false)
    setChecking(null)
    // If any of the user's themes is a restaurant, hint the search so
    // .restaurant / .menu appear alongside the standard TLD list.
    const forHint = Object.values(themes).some((t: any) => {
      const bt = (t?.content?.business_type) || t?.template_type
      return bt === 'restaurant'
    }) ? '&for=restaurant' : ''
    try {
      const r = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}${forHint}`)
      const j = await r.json()
      if (!r.ok) {
        setSearchError(friendlyError(j))
        return
      }
      const list: SearchResult[] = j.results || []
      setResults(list)
      // Kick off the sequential auto-checker for any rows we don't
      // already know about. For dotted queries this is a no-op (the
      // single row arrived pre-checked).
      void runAutoCheck(list)
    } catch (e: any) {
      setSearchError(e?.message || 'Network error')
    } finally {
      setSearching(false)
    }
  }

  /** Sleep that wakes up if the auto-check generation has been bumped
   *  (e.g. the user started a new search). Polls every 200ms so a
   *  cancel feels immediate without dropping the loop into a tight
   *  spin. */
  async function pacedWait(ms: number, gen: number): Promise<boolean> {
    const start = Date.now()
    while (Date.now() - start < ms) {
      if (checkGenRef.current !== gen) return false
      await new Promise((r) => setTimeout(r, 200))
    }
    return checkGenRef.current === gen
  }

  /** Fire one availability check and merge the response into results.
   *  Used by both the auto-check loop and the manual Retry button. */
  async function fetchCheck(domain: string): Promise<SearchResult | null> {
    try {
      const r = await fetch(`/api/domains/check?domain=${encodeURIComponent(domain)}`)
      const j = (await r.json()) as SearchResult
      setResults((prev) =>
        prev ? prev.map((row) => (row.domain === domain ? { ...row, ...j } : row)) : prev,
      )
      return j
    } catch {
      return null
    }
  }

  /** Walk every unchecked row in `initial`, calling /api/domains/check
   *  sequentially with a 10.5s gap between calls. Aborts cleanly if
   *  the user fires a new search or clicks Retry on a specific row. */
  async function runAutoCheck(initial: SearchResult[]) {
    const myGen = ++checkGenRef.current
    const targets = initial
      .filter((r) => !r.checked && r.available === null)
      .map((r) => r.domain)
    if (targets.length === 0) return

    setAutoChecking(true)
    try {
      for (let i = 0; i < targets.length; i++) {
        if (checkGenRef.current !== myGen) return
        const domain = targets[i]
        setChecking(domain)
        await fetchCheck(domain)
        if (checkGenRef.current !== myGen) return
        if (i < targets.length - 1) {
          const survived = await pacedWait(RATE_WINDOW_MS, myGen)
          if (!survived) return
        }
      }
    } finally {
      if (checkGenRef.current === myGen) {
        setChecking(null)
        setAutoChecking(false)
      }
    }
  }

  /** Manual retry on a specific row. Cancels any running auto-check so
   *  we don't double up on Porkbun calls. */
  async function checkOne(domain: string) {
    if (checking === domain) return
    checkGenRef.current++
    setAutoChecking(false)
    setChecking(domain)
    setSearchError(null)
    try {
      await fetchCheck(domain)
    } finally {
      setChecking(null)
    }
  }

  /**
   * Send the user to Stripe Checkout for this domain. The webhook
   * registers it at Porkbun, attaches it to Vercel, and (if a theme
   * was selected) wires it to that site's slug. Domain shows up under
   * "Your connected domains" within a couple of minutes after payment.
   */
  async function buy(domain: string) {
    if (!hasHosting) {
      // Custom domains need the hosting plan — push them to upgrade
      // instead of failing silently mid-checkout.
      window.location.href = '/pricing?upgrade=pro'
      return
    }
    setBuying(domain)
    try {
      const r = await fetch('/api/domains/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          theme_id: buyForThemeId || null,
          years: 1,
        }),
      })
      const j = await r.json()
      if (!r.ok || !j?.url) {
        setSearchError(friendlyError(j) || 'تعذّر بدء عملية الدفع.')
        return
      }
      window.location.href = j.url
    } catch (e: any) {
      setSearchError(e?.message || 'خطأ في الشبكة')
    } finally {
      setBuying(null)
    }
  }

  /**
   * Send the user to Stripe Checkout to extend an active domain.
   * Webhook bumps expires_at by the years they pay for.
   */
  async function renew(purchaseId: string, domain: string, years = 1) {
    setRenewing(purchaseId)
    try {
      const r = await fetch('/api/domains/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id: purchaseId, years }),
      })
      const j = await r.json()
      if (!r.ok || !j?.url) {
        toast({ type: 'error', message: `تعذّر تجديد ${domain}.`, description: j?.message || j?.error })
        return
      }
      window.location.href = j.url
    } catch (e: any) {
      toast({ type: 'error', message: 'خطأ في الشبكة', description: e?.message || String(e) })
    } finally {
      setRenewing(null)
    }
  }

  // Eligible themes — published + hostable
  const eligibleThemes = useMemo(() => {
    return Object.values(themes).filter((t) => t.is_published && t.slug)
  }, [themes])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-token pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">النطاقات</h1>
          <p className="mt-1 text-[13px] text-muted">
            اربط نطاقًا مخصصًا تملكه بالفعل، أو ابحث عن نطاق جديد. شهادة SSL تلقائية.
          </p>
        </div>
        {eligibleThemes.length > 0 && hasHosting && (
          <select
            onChange={(e) => { if (e.target.value) setAdding(e.target.value) }}
            value=""
            className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02]"
            style={{ appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
          >
            <option value="">+ اربط نطاقًا تملكه…</option>
            {eligibleThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.product_name}</option>
            ))}
          </select>
        )}
      </header>

      {hostingChecked && !hasHosting && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(94,106,210,0.10)' }}>
              <Lock className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-foreground">النطاقات المخصصة تتطلب خطة Pro</div>
              <p className="mt-1 text-[12.5px] text-muted">24.99$ شهريًا. وجِّه أي نطاق إلى موقعك على زينيا.</p>
            </div>
          </div>
          <Link href="/pricing?upgrade=pro" className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-white">
            الترقية إلى Pro ←
          </Link>
        </div>
      )}

      {/* ── Find a domain — availability + price via Vercel registrar API ─ */}
      <section className="mb-8 rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
          <h2 className="text-[14px] font-semibold text-foreground">ابحث عن نطاق جديد</h2>
        </div>
        <p className="mt-1 text-[12.5px] text-muted">
          اكتب اسمًا، وشاهد المتاح، واشترِه بنقرة واحدة — التسجيل وDNS وSSL تُجهَّز لك تلقائيًا.
        </p>

        {/* Free-domain entitlement banner — Pro accounts that haven't claimed
            their one free cheap-TLD domain yet. */}
        {isProProfile(entitlement) && !entitlement?.free_domain_claimed_at && (
          <div
            className="mt-3 flex flex-col gap-1 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.18)' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-[#15803d]" strokeWidth={2.5} />
              <span className="text-[12.5px] font-medium text-[#15803d]">
                🎁 نطاقك المجاني بانتظارك — سنة كاملة مجانًا مع Pro على الامتدادات الاقتصادية.
              </span>
            </div>
            <span className="ms-6 text-[11.5px] text-[#15803d]/80">
              تشمل عادةً <span dir="ltr">.store .site .online .shop .xyz</span> — تظهر بلا سعر تلقائيًا عند البحث. الامتدادات الأغلى (مثل .com) تحصل على خصم 30%.
            </span>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); search() }}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="mystore  أو  mystore.com"
              className="w-full rounded-full border border-token bg-surface py-2 ps-9 pe-3 text-[13px] text-foreground outline-none transition focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
          >
            {searching ? 'جارٍ الفحص…' : 'تحقق من التوفّر'}
          </button>
        </form>

        {searchError && (
          <div className="mt-3 rounded-md border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12.5px] text-[#b91c1c]">
            {searchError}
          </div>
        )}

        {results && autoChecking && (() => {
          const total = results.length
          const checkedCount = results.filter((r) => r.checked).length
          const remaining = total - checkedCount
          const seconds = Math.max(0, (remaining - 1) * 10 + 2)
          return (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-token bg-[rgba(94,106,210,0.06)] px-3 py-2 text-[12px] text-primary">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>
                نفحص كل امتداد ({checkedCount} من {total} اكتمل) · يتبقّى ~{seconds}ث
              </span>
              <span className="ms-auto text-muted">
                يسمح المُسجِّل بفحص واحد كل 10 ثوانٍ — ننظّم ذلك تلقائيًا.
              </span>
            </div>
          )
        })()}

        {results && results.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-token">
            {/* If the user owns multiple eligible sites, let them pick
                which one the domain attaches to BEFORE clicking Buy.
                Empty value means "decide later" — they can connect it
                from the regular "Connect a domain you own" flow once it
                lands in their account. */}
            {eligibleThemes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-token bg-[#fafaf7] px-3 py-2 text-[12px] text-muted">
                <span>اربطه بـ:</span>
                <select
                  value={buyForThemeId}
                  onChange={(e) => setBuyForThemeId(e.target.value)}
                  className="rounded-md border border-token bg-white px-2 py-1 text-[12px] text-foreground outline-none focus:border-primary"
                >
                  <option value="">أقرر بعد الشراء</option>
                  {eligibleThemes.map((t) => (
                    <option key={t.id} value={t.id}>{t.product_name}</option>
                  ))}
                </select>
              </div>
            )}
            <table className="w-full text-start text-[12.5px]">
              <thead className="bg-[#fafaf7]">
                <tr>
                  <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">النطاق</th>
                  <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">الحالة</th>
                  <th className="px-3 py-2 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">السعر / سنة</th>
                  <th className="px-3 py-2 text-end text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isPending = buying === r.domain
                  const isCheckingThis = checking === r.domain
                  // Preview the entitlement price for this row. Server re-decides
                  // at checkout — this is display only.
                  const deal =
                    r.available === true &&
                    r.retail_usd_year != null &&
                    r.wholesale_usd_year != null
                      ? priceDomainFor(entitlement, {
                          wholesale: r.wholesale_usd_year,
                          retail: r.retail_usd_year,
                          premium: !!r.premium,
                        })
                      : 'standard'
                  // Row is queued if the loop is running but hasn't
                  // reached it yet. We keep it visually distinct from
                  // genuine failures so the user understands waiting is
                  // intentional, not a bug.
                  const isQueued = !r.checked && autoChecking && !isCheckingThis
                  return (
                    <tr key={r.domain} className="border-t border-token">
                      <td className="px-3 py-2 font-mono text-foreground">{r.domain}</td>
                      <td className="px-3 py-2">
                        {r.available === true ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#15803d]">
                            <CheckCircle2 className="h-3 w-3" /> متاح
                          </span>
                        ) : r.available === false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(28,28,28,0.06)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                            محجوز
                          </span>
                        ) : isCheckingThis ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(94,106,210,0.12)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-primary">
                            <RefreshCw className="h-3 w-3 animate-spin" /> جارٍ الفحص…
                          </span>
                        ) : isQueued ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.04)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                            <Clock className="h-3 w-3" /> بالانتظار…
                          </span>
                        ) : r.error_code === 'rate_limited' ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-[rgba(217,119,6,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b45309]"
                            title="حد المُسجِّل — فحص واحد كل 10 ثوانٍ"
                          >
                            <Clock className="h-3 w-3" /> فترة تهدئة
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-[rgba(217,119,6,0.10)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b45309]"
                            title={r.message || 'فشل البحث'}
                          >
                            <AlertCircle className="h-3 w-3" /> تعذّر الفحص
                          </span>
                        )}
                        {r.premium && (
                          <span className="ms-1 rounded-full bg-[rgba(200,169,106,0.16)] px-1.5 py-0.5 text-[10px] font-semibold text-[#9b6f00]">مميّز</span>
                        )}
                        {r.first_year_promo && (
                          <span className="ms-1 rounded-full bg-[rgba(94,106,210,0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-primary" title={`يُجدَّد بسعر أعلى بعد السنة الأولى`}>
                            عرض السنة الأولى
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-foreground">
                        {r.retail_usd_year == null ? (
                          '—'
                        ) : deal === 'free' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-muted line-through decoration-1">${r.retail_usd_year.toFixed(2)}</span>
                            <span className="rounded-full bg-[rgba(21,128,61,0.10)] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#15803d]">مجاني · سنة</span>
                          </span>
                        ) : deal === 'pro' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-muted line-through decoration-1">${r.retail_usd_year.toFixed(2)}</span>
                            <span className="font-semibold text-foreground">${(r.retail_usd_year * (1 - PRO_DOMAIN_DISCOUNT_PCT / 100)).toFixed(2)}</span>
                          </span>
                        ) : (
                          `$${r.retail_usd_year.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-3 py-2 text-end">
                        {r.available === true ? (
                          <button
                            onClick={() => buy(r.domain)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {isPending ? 'جارٍ التحميل…' : deal === 'free' ? <>احصل عليه مجانًا <ArrowRight className="h-3 w-3 rtl-flip" /></> : <>اشترِ الآن <ArrowRight className="h-3 w-3 rtl-flip" /></>}
                          </button>
                        ) : r.available === false ? (
                          <span className="text-[11.5px] text-muted">محجوز مسبقًا</span>
                        ) : isCheckingThis || isQueued ? (
                          <span className="text-[11.5px] text-muted">
                            {isCheckingThis ? '…' : 'التالي'}
                          </span>
                        ) : (
                          <button
                            onClick={() => checkOne(r.domain)}
                            title={
                              r.error_code === 'rate_limited'
                                ? 'حد المُسجِّل — حاول بعد ~10 ثوانٍ'
                                : 'أعد فحص هذا الامتداد'
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-token bg-white px-2.5 py-1 text-[11.5px] font-semibold text-foreground transition hover:bg-black/5"
                          >
                            إعادة المحاولة
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="border-t border-token bg-[#fafaf7] px-3 py-2 text-[11.5px] text-muted">
              شراء نطاق عبر زينيا يجهّزه تلقائيًا — التسجيل وDNS وSSL. لا سجلّات يدوية للنسخ.
            </div>
          </div>
        )}
        {results && results.length === 0 && (
          <div className="mt-3 text-[12.5px] text-muted">لا نتائج.</div>
        )}
      </section>

      {/* ── Free Zenya subdomains — every published site gets one, free ── */}
      {eligibleThemes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
            نطاقاتك المجانية على زينيا
          </h2>
          <div className="space-y-2">
            {eligibleThemes.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(21,128,61,0.10)' }}>
                    <Globe className="h-4 w-4" strokeWidth={2} style={{ color: '#15803d' }} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <code dir="ltr" className="text-[14px] font-semibold text-foreground">{publicSiteHost(t.slug!)}</code>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                            style={{ background: 'rgba(21,128,61,0.10)', color: '#15803d', border: '1px solid rgba(21,128,61,0.30)' }}>
                        مجاني · مشمول
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted">
                      يشير إلى <strong className="text-foreground">{t.product_name}</strong>
                    </div>
                  </div>
                </div>
                <a href={publicSiteUrl(t.slug!)} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-black/5">
                  فتح <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-muted">
            كل موقع منشور يحصل على نطاق <span dir="ltr">اسمك.zenyaai.co</span> مجانًا. تريد نطاقك الخاص؟ اربطه أو اشترِه من الأعلى.
          </p>
        </section>
      )}

      {/* ── Connected domains ─────────────────────────────────────────── */}
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
        نطاقاتك المربوطة
      </h2>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-token bg-white p-5">
              <div className="h-9 w-9 rounded-lg bg-[rgba(28,28,28,0.06)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-[rgba(28,28,28,0.06)]" />
                <div className="h-2.5 w-1/3 rounded bg-[rgba(28,28,28,0.04)]" />
              </div>
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <EmptyState hasHosting={hasHosting} hasEligible={eligibleThemes.length > 0} onAdd={() => eligibleThemes[0] && setAdding(eligibleThemes[0].id)} />
      ) : (
        <div className="space-y-2">
          {domains.map((d) => {
            const s = STATUS[d.status]
            const Icon = s.icon
            const theme = themes[d.theme_id]
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-token bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: s.tint }}>
                    <Icon className="h-4 w-4" strokeWidth={2} style={{ color: s.fg }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-[14px] font-semibold text-foreground">{d.domain}</code>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                            style={{ background: s.tint, color: s.fg, border: `1px solid ${s.ring}` }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted">
                      يشير إلى <strong className="text-foreground">{theme?.product_name || 'موقع غير معروف'}</strong>
                      {theme?.slug && <> · <span dir="ltr">{publicSiteHost(theme.slug)}</span></>}
                    </div>
                    {d.error_message && (
                      <div className="mt-1 text-[12px] text-[#b91c1c]">{d.error_message}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Renew CTA — only for domains we sold the user (matched
                      by domain string), and only when expiry is < 60d
                      away. Hides for domains attached via "Connect a
                      domain you own" flow. */}
                  {(() => {
                    const p = purchases[d.domain]
                    if (!p || p.status !== 'active' || !p.expires_at) return null
                    const days = Math.round(
                      (new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                    if (days > 60) return null
                    const urgent = days <= 7
                    return (
                      <button
                        onClick={() => renew(p.id, p.domain)}
                        disabled={renewing === p.id}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-50"
                        style={{ background: urgent ? '#b45309' : '#5e6ad2' }}
                        title={days < 0 ? `انتهى قبل ${-days} يومًا` : `ينتهي خلال ${days} يومًا`}
                      >
                        {renewing === p.id
                          ? 'جارٍ التحميل…'
                          : `تجديد · ${days < 0 ? 'منتهٍ' : `${days} يومًا`}`}
                      </button>
                    )
                  })()}
                  {d.status === 'live' && (
                    <a href={`https://${d.domain}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-black/5">
                      فتح <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                  )}
                  {d.status !== 'live' && (
                    <button onClick={() => recheck(d.id)} disabled={busyId === d.id}
                            className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:bg-black/5">
                      <RefreshCw className={'h-3 w-3 ' + (busyId === d.id ? 'animate-spin' : '')} />
                      إعادة فحص
                    </button>
                  )}
                  <button onClick={() => remove(d.id, d.domain)} disabled={busyId === d.id}
                          className="rounded-md border border-token bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:bg-black/5">
                    إزالة
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <AddDomainModal themeId={adding} onClose={() => setAdding(null)} onAdded={() => load()} />
      )}
    </div>
  )
}

/** Turn an API error payload into a friendly one-liner. The big one is
 *  Porkbun's rate-limit — the raw "1 out of 1 checks within 10 seconds
 *  used" string is jargon, replace it. */
function friendlyError(j: any): string {
  if (!j) return ''
  if (j.error_code === 'rate_limited' || j.error === 'rate_limited') {
    return 'مُسجِّل النطاقات في فترة تهدئة. انتظر نحو 10 ثوانٍ ثم حاول مجددًا.'
  }
  const m = String(j.message || j.error || '')
  if (/within\s+\d+\s+seconds?\s+used/i.test(m)) {
    return 'مُسجِّل النطاقات في فترة تهدئة. انتظر نحو 10 ثوانٍ ثم حاول مجددًا.'
  }
  return m
}

function EmptyState({ hasHosting, hasEligible, onAdd }: { hasHosting: boolean; hasEligible: boolean; onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white p-12 text-center">
      <Globe className="mx-auto h-9 w-9 text-muted" strokeWidth={1.5} />
      <h3 className="mt-4 text-[16px] font-semibold text-foreground">لا نطاقات مربوطة بعد</h3>
      {hasHosting && hasEligible ? (
        <>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
            وجِّه نطاقًا تملكه إلى زينيا — أضف سجلَّي DNS، ونصدر شهادة SSL تلقائيًا.
          </p>
          <button onClick={onAdd} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            اربط نطاقك الأول
          </button>
        </>
      ) : !hasHosting ? (
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
          رقِّ إلى باقة الاستضافة وانشر موقعًا، ثم اربط أي نطاق تملكه.
        </p>
      ) : (
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-muted">
          انشر موقعًا مستضافًا على زينيا أولًا، ثم عُد لربط نطاق مخصص به.
        </p>
      )}
    </div>
  )
}
