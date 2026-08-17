'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Search, Globe, Check, Copy, ExternalLink, Sparkles, Map, ShieldCheck,
  RotateCcw, Eye, EyeOff, ArrowRight, Info, BarChart3, RefreshCw, Link2, Unlink,
} from 'lucide-react'
import { useNotify } from '@/components/ui/Notify'
import { SEO_TITLE_MAX, SEO_DESC_MAX, parseGscVerification, type SeoOverrides } from '@/lib/seo'

type GscStatus = { configured: boolean; connected: boolean; email: string | null }

export type SeoSite = {
  id: string
  productName: string
  slug: string | null
  templateType: string
  isPublished: boolean
  host: string | null
  url: string | null
  sitemapUrl: string | null
  overrides: SeoOverrides
  resolved: {
    title: string
    description: string
    keywords: string[]
    ogImage: string | null
  }
}

const TEMPLATE_LABEL: Record<string, string> = {
  restaurant: 'مطعم', atlas: 'تطبيق', lookbook: 'أزياء',
  studio: 'ستوديو', services: 'خدمات', wellness: 'عافية',
}

export default function SeoManager({ sites: initialSites }: { sites: SeoSite[] }) {
  const notify = useNotify()
  const searchParams = useSearchParams()
  const [sites, setSites] = useState(initialSites)
  const [selectedId, setSelectedId] = useState(initialSites[0]?.id ?? '')
  const [gsc, setGsc] = useState<GscStatus | null>(null)

  const selected = useMemo(() => sites.find((s) => s.id === selectedId) ?? null, [sites, selectedId])

  function updateSite(id: string, patch: Partial<SeoSite>) {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  // Load the user's Search Console connection status once.
  async function refreshGsc() {
    try {
      const r = await fetch('/api/gsc/status')
      if (r.ok) setGsc(await r.json())
    } catch {}
  }
  useEffect(() => { refreshGsc() }, [])

  // Toast the OAuth round-trip result (?gsc=connected|denied|error).
  useEffect(() => {
    const flag = searchParams.get('gsc')
    if (!flag) return
    if (flag === 'connected') notify.toast({ type: 'success', message: 'تم ربط Google Search Console', description: 'بيانات البحث الحيّة ستظهر الآن لمواقعك المنشورة.' })
    else if (flag === 'denied') notify.toast({ type: 'warning', message: 'أُلغي الربط', description: 'لم تمنح زينيا صلاحية القراءة من Search Console.' })
    else {
      const reason = searchParams.get('gsc_reason')
      const detail = reason === 'redirect_uri_mismatch'
        ? 'عنوان الإرجاع لا يطابق ما هو مسجّل في Google Cloud. تأكّد أن GOOGLE_OAUTH_REDIRECT_URI مطابق تمامًا للعنوان المسجّل.'
        : reason === 'invalid_client'
          ? 'بيانات عميل OAuth غير صحيحة. تحقّق من GOOGLE_OAUTH_CLIENT_ID و GOOGLE_OAUTH_CLIENT_SECRET.'
          : reason
            ? `سبب من جوجل: ${reason}`
            : 'حاول مرة أخرى.'
      notify.toast({ type: 'error', message: 'تعذّر ربط Search Console', description: detail })
    }
    // clean the URL
    if (typeof window !== 'undefined') window.history.replaceState({}, '', '/dashboard/seo')
    if (flag === 'connected') refreshGsc()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">السيو</h1>
        <p className="mt-1 text-[13px] text-muted">
          تحكّم كامل في شكل موقعك داخل جوجل — العنوان، الوصف، معاينة النتيجة الحيّة، خريطة الموقع، والتحقّق من Search Console.
        </p>
      </header>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {sites.length > 1 && (
            <SiteSwitcher sites={sites} selectedId={selectedId} onSelect={setSelectedId} />
          )}
          {selected && (
            <SiteEditor
              key={selected.id}
              site={selected}
              gscStatus={gsc}
              onGscChange={refreshGsc}
              onSaved={(patch) => updateSite(selected.id, patch)}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ───────────────────────── site switcher ───────────────────────── */

function SiteSwitcher({
  sites, selectedId, onSelect,
}: { sites: SeoSite[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {sites.map((s) => {
        const active = s.id === selectedId
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={[
              'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
              active
                ? 'border-primary/30 bg-[rgba(94,106,210,0.10)] text-primary'
                : 'border-token bg-white text-muted hover:text-foreground',
            ].join(' ')}
          >
            <span className={['h-1.5 w-1.5 rounded-full', s.isPublished ? 'bg-[#15803d]' : 'bg-[#b45309]'].join(' ')} />
            <span className="truncate max-w-[160px]">{s.productName}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── per-site editor ───────────────────────── */

function SiteEditor({
  site, gscStatus, onGscChange, onSaved,
}: {
  site: SeoSite
  gscStatus: GscStatus | null
  onGscChange: () => void
  onSaved: (patch: Partial<SeoSite>) => void
}) {
  const notify = useNotify()
  const [title, setTitle] = useState(site.overrides.title ?? '')
  const [description, setDescription] = useState(site.overrides.description ?? '')
  const [keywords, setKeywords] = useState(site.overrides.keywords ?? '')
  const [ogImage, setOgImage] = useState(site.overrides.ogImage ?? '')
  const [noindex, setNoindex] = useState(!!site.overrides.noindex)
  const [saving, setSaving] = useState(false)

  const effTitle = (title.trim() || site.resolved.title).slice(0, 120)
  const effDesc = (description.trim() || site.resolved.description).slice(0, 300)

  const dirty =
    (title.trim() || '') !== (site.overrides.title ?? '') ||
    (description.trim() || '') !== (site.overrides.description ?? '') ||
    (keywords.trim() || '') !== (site.overrides.keywords ?? '') ||
    (ogImage.trim() || '') !== (site.overrides.ogImage ?? '') ||
    noindex !== !!site.overrides.noindex

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/themes/${site.id}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          keywords: keywords.trim(),
          ogImage: ogImage.trim(),
          noindex,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.message || j?.error || 'فشل الحفظ')
      onSaved({
        overrides: j.overrides,
        resolved: {
          title: j.resolved.title,
          description: j.resolved.description,
          keywords: j.resolved.keywords,
          ogImage: j.resolved.ogImage ?? null,
        },
      })
      notify.toast({ type: 'success', message: 'تم حفظ إعدادات السيو', description: site.isPublished ? 'ستظهر التحديثات في جوجل خلال أيام قليلة.' : 'انشر الموقع ليظهر في نتائج البحث.' })
    } catch (e: any) {
      notify.toast({ type: 'error', message: 'تعذّر الحفظ', description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 lg:gap-6 lg:grid-cols-[1fr_minmax(360px,420px)]">
      {/* ── editor column ── (below the live preview on phone/iPad, beside it on desktop) */}
      <div className="order-2 space-y-5 lg:order-1">
        <div className="rounded-2xl border border-token bg-white p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">بيانات البحث</h2>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
            زينيا يكتب هذه الحقول تلقائيًا من محتوى موقعك. اترك الحقل فارغًا لاستخدام النص التلقائي، أو اكتب نصك للتحكّم الكامل.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              label="عنوان الصفحة (Title)"
              hint="ما يظهر كسطر أزرق كبير في نتيجة جوجل. ابدأ باسم النشاط."
              value={title}
              onChange={setTitle}
              placeholder={site.resolved.title}
              max={SEO_TITLE_MAX}
              onReset={title ? () => setTitle('') : undefined}
            />
            <Field
              label="وصف ميتا (Description)"
              hint="السطر الرمادي تحت العنوان. اجعله دعوة واضحة ومحدّدة الموقع."
              value={description}
              onChange={setDescription}
              placeholder={site.resolved.description}
              max={SEO_DESC_MAX}
              textarea
              onReset={description ? () => setDescription('') : undefined}
            />
            <Field
              label="كلمات مفتاحية (اختياري)"
              hint="افصل بينها بفاصلة. تساعد في التنظيم — جوجل يعتمد أساسًا على المحتوى."
              value={keywords}
              onChange={setKeywords}
              placeholder={site.resolved.keywords.join('، ')}
              onReset={keywords ? () => setKeywords('') : undefined}
            />
            <Field
              label="صورة المشاركة (OG image · اختياري)"
              hint="رابط صورة تظهر عند مشاركة الموقع على واتساب/تويتر. اتركه فارغًا لاستخدام صورة الواجهة تلقائيًا."
              value={ogImage}
              onChange={setOgImage}
              placeholder={site.resolved.ogImage || 'https://…/صورة.jpg'}
              ltr
              onReset={ogImage ? () => setOgImage('') : undefined}
            />
          </div>

          {/* visibility toggle */}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-token bg-surface/50 p-3.5">
            <input
              type="checkbox"
              checked={noindex}
              onChange={(e) => setNoindex(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#b91c1c]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                {noindex ? <EyeOff className="h-3.5 w-3.5 text-[#b91c1c]" /> : <Eye className="h-3.5 w-3.5 text-[#15803d]" />}
                إخفاء الموقع من محرّكات البحث
              </div>
              <div className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
                فعّلها إذا كان الموقع قيد الإعداد ولا تريد ظهوره في جوجل بعد. الوضع الافتراضي: مرئي.
              </div>
            </div>
          </label>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-[11.5px] text-muted">
              {dirty ? 'لديك تغييرات غير محفوظة' : 'كل شيء محفوظ'}
            </div>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              {!saving && <Check className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── sitemap ── */}
        <SitemapCard site={site} />

        {/* ── google search console ── */}
        <SearchConsoleCard
          site={site}
          connection={gscStatus}
          onGscChange={onGscChange}
          onSavedSite={onSaved}
        />
      </div>

      {/* ── live preview column ── (shown first on phone/iPad so the Google-result
          preview is what the owner sees; sticky beside the form on desktop) */}
      <div className="order-1 space-y-5 lg:order-2">
        <div className="lg:sticky lg:top-4">
          <SerpPreview
            host={site.host}
            title={effTitle}
            description={effDesc}
            name={site.productName}
            published={site.isPublished}
            noindex={noindex}
          />
          <SocialPreview
            host={site.host}
            title={effTitle}
            description={effDesc}
            image={ogImage.trim() || site.resolved.ogImage}
          />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── form field ───────────────────────── */

function Field({
  label, hint, value, onChange, placeholder, max, textarea, onReset, ltr,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  max?: number
  textarea?: boolean
  onReset?: () => void
  ltr?: boolean
}) {
  const len = value.trim().length
  const over = max ? len > max : false
  const near = max ? len > max * 0.9 : false
  const counterColor = over ? '#b91c1c' : near ? '#b45309' : '#9a9a9a'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[12.5px] font-semibold text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[10.5px] font-medium text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> تلقائي
            </button>
          )}
          {max != null && (
            <span className="tabular-nums text-[10.5px] font-medium" style={{ color: counterColor }}>
              {len}/{max}
            </span>
          )}
        </div>
      </div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-token bg-white px-3 py-2 text-[13px] leading-[1.6] text-foreground outline-none placeholder:text-muted/60 focus:border-primary/40 focus:ring-2 focus:ring-[rgba(94,106,210,0.12)]"
        />
      ) : (
        <input
          type="text"
          dir={ltr ? 'ltr' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={
            'w-full rounded-lg border border-token bg-white px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted/60 focus:border-primary/40 focus:ring-2 focus:ring-[rgba(94,106,210,0.12)] ' +
            (ltr ? 'text-left' : '')
          }
        />
      )}
      <p className="mt-1 text-[11px] leading-[1.5] text-muted">{hint}</p>
    </div>
  )
}

/* ───────────────────────── Google SERP preview ───────────────────────── */

function SerpPreview({
  host, title, description, name, published, noindex,
}: {
  host: string | null
  title: string
  description: string
  name: string
  published: boolean
  noindex: boolean
}) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" strokeWidth={2} />
        <h3 className="text-[13px] font-semibold text-foreground">معاينة نتيجة جوجل</h3>
        <span className="ms-auto text-[10.5px] text-muted">حاسوب</span>
      </div>

      {/* the SERP snippet — LTR like a real Google result */}
      <div dir="ltr" className="rounded-xl border border-token bg-white p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: '#5e6ad2' }}
          >
            {name.trim().charAt(0).toUpperCase() || 'Z'}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] text-[#202124]">{name}</div>
            <div className="truncate text-[12px] text-[#4d5156]">{host || 'yourname.zenyaai.co'}</div>
          </div>
        </div>
        <div
          className="mt-1.5 truncate text-[18px] leading-[1.3] text-[#1a0dab] hover:underline"
          style={{ fontWeight: 400 }}
          dir="auto"
        >
          {title}
        </div>
        <div className="mt-1 text-[13px] leading-[1.45] text-[#4d5156]" dir="auto"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </div>
      </div>

      <div className="mt-3 text-[11px] leading-[1.5] text-muted">
        {noindex ? (
          <span className="text-[#b91c1c]">الموقع مخفي حاليًا عن جوجل (noindex).</span>
        ) : published ? (
          'هكذا يظهر موقعك عند البحث عنه. النتائج الفعلية تحدّثها جوجل خلال أيام من النشر.'
        ) : (
          'معاينة فقط — انشر الموقع ليبدأ جوجل بفهرسته وإظهاره.'
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── social share preview ───────────────────────── */

function SocialPreview({
  host, title, description, image,
}: { host: string | null; title: string; description: string; image: string | null }) {
  return (
    <div className="mt-5 rounded-2xl border border-token bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-primary" strokeWidth={2} />
        <h3 className="text-[13px] font-semibold text-foreground">معاينة المشاركة (واتساب · تويتر)</h3>
      </div>
      <div className="overflow-hidden rounded-xl border border-token">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-surface text-[11.5px] text-muted">
            لا توجد صورة واجهة — أضف صورة بارزة لتظهر عند المشاركة
          </div>
        )}
        <div className="bg-white p-3">
          <div className="truncate text-[11px] uppercase tracking-wide text-muted" dir="ltr">{host || 'yourname.zenyaai.co'}</div>
          <div className="mt-0.5 truncate text-[13px] font-semibold text-foreground" dir="auto">{title}</div>
          <div className="mt-0.5 line-clamp-1 text-[12px] text-muted" dir="auto">{description}</div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── sitemap card ───────────────────────── */

function SitemapCard({ site }: { site: SeoSite }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-center gap-2">
        <Map className="h-4 w-4 text-primary" strokeWidth={2} />
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">خريطة الموقع (Sitemap)</h2>
      </div>
      {site.isPublished && site.sitemapUrl ? (
        <>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
            زينيا يُنشئ خريطة موقع وملفّ robots.txt تلقائيًا لموقعك. أرسل هذا الرابط إلى Google Search Console ليكتشف جوجل صفحاتك أسرع.
          </p>
          <CopyRow value={site.sitemapUrl} />
        </>
      ) : (
        <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
          انشر موقعك أولًا ليحصل على عنوان مباشر وخريطة موقع.{' '}
          <Link href="/dashboard/sites" className="text-primary hover:underline">اذهب إلى المواقع ←</Link>
        </p>
      )}
    </div>
  )
}

/* ───────────────────────── search console card ───────────────────────── */

function SearchConsoleCard({
  site, connection, onGscChange, onSavedSite,
}: {
  site: SeoSite
  connection: GscStatus | null
  onGscChange: () => void
  onSavedSite: (patch: Partial<SeoSite>) => void
}) {
  const notify = useNotify()
  const [showManual, setShowManual] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [verifyInput, setVerifyInput] = useState('')
  const [savingVerify, setSavingVerify] = useState(false)

  // What's already saved for this site.
  const savedToken = site.overrides.gscVerification || ''
  const savedFile = site.overrides.gscFile || ''
  const isVerifiedSet = !!savedToken || !!savedFile

  // What the current paste resolves to.
  const parsed = parseGscVerification(verifyInput)
  const detected =
    parsed.method === 'file' ? { method: 'file' as const, value: parsed.fileName! }
    : parsed.method === 'meta' ? { method: 'meta' as const, value: parsed.token! }
    : null

  async function saveVerify() {
    if (!detected) {
      notify.toast({ type: 'error', message: 'لم نتعرّف على التحقّق', description: 'الصق وسم <meta> أو اسم ملف googleXXXX.html كما أعطاك جوجل.' })
      return
    }
    setSavingVerify(true)
    try {
      const r = await fetch(`/api/themes/${site.id}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gscVerification: verifyInput }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.message || 'فشل الحفظ')
      onSavedSite({ overrides: j.overrides, resolved: {
        title: j.resolved.title, description: j.resolved.description,
        keywords: j.resolved.keywords, ogImage: j.resolved.ogImage ?? null,
      } })
      setVerifyInput('')
      notify.toast({
        type: 'success',
        message: detected.method === 'file' ? 'حُفظ ملف التحقّق وأصبح مُستضافًا على موقعك' : 'حُفظ وسم التحقّق وأُضيف إلى موقعك',
        description: site.isPublished ? 'ارجع الآن إلى Search Console واضغط «تحقّق».' : 'انشر الموقع ثم اضغط «تحقّق» في Search Console.',
      })
    } catch (e: any) {
      notify.toast({ type: 'error', message: 'تعذّر الحفظ', description: e?.message })
    } finally {
      setSavingVerify(false)
    }
  }

  async function disconnect() {
    const ok = await notify.confirm({
      title: 'فصل Google Search Console؟',
      message: 'سيتوقّف عرض بيانات البحث الحيّة. يمكنك إعادة الربط في أي وقت.',
      confirmText: 'فصل',
      tone: 'danger',
    })
    if (!ok.confirmed) return
    setDisconnecting(true)
    try {
      await fetch('/api/gsc/disconnect', { method: 'POST' })
      onGscChange()
      notify.toast({ type: 'info', message: 'تم فصل Search Console' })
    } finally {
      setDisconnecting(false)
    }
  }

  const configured = connection?.configured ?? false
  const connected = connection?.connected ?? false

  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2} />
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Google Search Console</h2>
        {connected && (
          <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d]">
            <Check className="h-3 w-3" /> مربوط
          </span>
        )}
      </div>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
        اربط حسابك في جوجل لترى بيانات البحث الحيّة لموقعك — مرّات الظهور، النقرات، متوسط الترتيب، والكلمات التي يجدك بها الناس.
      </p>

      {/* ── connection state ── */}
      {connected ? (
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-xl border border-token bg-surface/40 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-foreground">مربوط بحساب جوجل</div>
              {connection?.email && <div dir="ltr" className="truncate text-[11.5px] text-muted">{connection.email}</div>}
            </div>
            <button
              type="button"
              onClick={disconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-2.5 py-1 text-[11.5px] font-medium text-muted hover:text-foreground disabled:opacity-50"
            >
              <Unlink className="h-3 w-3" /> فصل
            </button>
          </div>
          <PerformancePanel site={site} />
        </div>
      ) : (
        <div className="mt-4">
          {configured ? (
            <a
              href="/api/gsc/connect"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
            >
              <Link2 className="h-4 w-4" /> اربط Google Search Console
            </a>
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-[rgba(217,119,6,0.08)] p-3 text-[11.5px] leading-[1.5] text-[#b45309]">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>الربط المباشر قيد التفعيل. حتى ذلك الحين، استخدم التحقّق اليدوي بالأسفل لإرسال موقعك إلى Search Console.</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="mt-3 text-[11.5px] font-medium text-primary hover:underline"
          >
            {showManual ? 'إخفاء' : 'أو أثبت الملكية يدويًا (علامة HTML أو ملف) ←'}
          </button>
        </div>
      )}

      {/* ── manual verification guide (collapsible when connect is available) ── */}
      <div className={connected ? 'hidden' : showManual || !configured ? 'mt-4 space-y-4' : 'hidden'}>

        {/* Step 1 — add the property (exact URL, copyable) */}
        <div>
          <StepHead n={1} title="أضف موقعك في Search Console" />
          <p className="mt-1 text-[11.5px] leading-[1.55] text-muted">
            افتح{' '}
            <Link
              href={site.url
                ? `https://search.google.com/search-console/welcome?resource_id=${encodeURIComponent(site.url.endsWith('/') ? site.url : site.url + '/')}`
                : 'https://search.google.com/search-console/welcome'}
              target="_blank"
              className="text-primary hover:underline"
            >Search Console</Link>{' '}
            → «إضافة خاصية» → اختر <b>«بادئة عنوان URL»</b> والصق هذا العنوان بالضبط:
          </p>
          <CopyRow value={site.url ? site.url + (site.url.endsWith('/') ? '' : '/') : 'انشر الموقع أولًا'} />
        </div>

        {/* Step 2 — paste EITHER the meta tag OR the HTML file name; we detect + host it */}
        <div>
          <StepHead n={2} title="الصق ما أعطاك جوجل — وسم أو ملف" />
          <p className="mt-1 text-[11.5px] leading-[1.55] text-muted">
            في Search Console، اختر <b>«علامة HTML»</b> وانسخ الوسم كاملًا، <b>أو</b> اختر <b>«ملف HTML»</b> وانسخ اسم الملف
            (<code dir="ltr" className="rounded bg-surface px-1 text-[10.5px]">googleXXXX.html</code>). الصقه هنا — زينيا يكتشف الطريقة ويضيفها لموقعك تلقائيًا. <b>لا تحتاج لرفع أي ملف بنفسك.</b>
          </p>
          {isVerifiedSet && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[rgba(21,128,61,0.08)] px-3 py-2 text-[11px] text-[#15803d]">
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate">
                {savedFile
                  ? <>ملف التحقّق مُستضاف: <code dir="ltr" className="rounded bg-white/60 px-1">{savedFile}</code></>
                  : <>وسم التحقّق مُضاف إلى موقعك.</>}
              </span>
            </div>
          )}
          <textarea
            dir="ltr"
            rows={2}
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder={'<meta name="google-site-verification" content="…" />   أو   googleXXXX.html'}
            className="mt-2 w-full resize-none rounded-lg border border-token bg-white px-3 py-2 text-left font-mono text-[11.5px] leading-[1.5] text-foreground outline-none placeholder:text-muted/50 focus:border-primary/40 focus:ring-2 focus:ring-[rgba(94,106,210,0.12)]"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0 text-[11px]">
              {verifyInput.trim() === '' ? (
                <span className="text-muted">الصق الوسم كاملًا أو اسم الملف.</span>
              ) : detected ? (
                <span className="inline-flex items-center gap-1 text-[#15803d]">
                  <Check className="h-3 w-3" /> {detected.method === 'file' ? 'ملف HTML:' : 'علامة HTML:'}{' '}
                  <code dir="ltr" className="truncate rounded bg-surface px-1 py-0.5">{detected.value.slice(0, 24)}{detected.value.length > 24 ? '…' : ''}</code>
                </span>
              ) : (
                <span className="text-[#b45309]">لم نتعرّف عليه — تأكّد أنك نسخت الوسم كاملًا أو اسم الملف.</span>
              )}
            </div>
            <button
              type="button"
              onClick={saveVerify}
              disabled={savingVerify || !detected}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-40"
            >
              {savingVerify ? 'جارٍ الحفظ…' : 'احفظ وأضِف للموقع'}
            </button>
          </div>
        </div>

        {/* Step 3 — verify */}
        <div>
          <StepHead n={3} title="اضغط «تحقّق» في Search Console" />
          <p className="mt-1 text-[11.5px] leading-[1.55] text-muted">
            بعد الحفظ هنا{isVerifiedSet ? ' ✓' : ''}، ارجع إلى تبويب Search Console واضغط زر <b>«تحقّق» (Verify)</b>. سيجد جوجل التحقّق في موقعك.
            {!site.isPublished && <span className="text-[#b45309]"> — لكن انشر موقعك أولًا حتى يكون الوسم مباشرًا.</span>}
          </p>
        </div>

        {/* Step 4 — submit sitemap */}
        <div>
          <StepHead n={4} title="أرسل خريطة الموقع" />
          <p className="mt-1 text-[11.5px] leading-[1.55] text-muted">
            في Search Console → «خرائط المواقع» (Sitemaps)، الصق هذا الرابط واضغط «إرسال»:
          </p>
          <CopyRow value={site.sitemapUrl || 'انشر الموقع أولًا'} />
        </div>
      </div>
    </div>
  )
}

function StepHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-white">{n}</span>
      <span className="text-[12.5px] font-semibold text-foreground">{title}</span>
    </div>
  )
}

/* ───────────────────────── live GSC performance ───────────────────────── */

type PerfData = {
  connected: boolean
  reason: 'ok' | 'no_data_yet' | 'not_published' | 'property_not_found' | 'not_connected'
  property?: string
  expectedProperty?: string
  availableProperties?: string[]
  totals?: { clicks: number; impressions: number; ctr: number; position: number }
  queries?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
}

function PerformancePanel({ site }: { site: SeoSite }) {
  const [data, setData] = useState<PerfData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`/api/gsc/performance?themeId=${site.id}`)
      setData(await r.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [site.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-token bg-surface/40 p-4 text-[12px] text-muted">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> جارٍ جلب بيانات البحث…
      </div>
    )
  }
  if (!data) {
    return (
      <div className="mt-4 rounded-xl border border-token bg-surface/40 p-4 text-[12px] text-muted">
        تعذّر جلب البيانات. <button onClick={load} className="text-primary hover:underline">أعد المحاولة</button>
      </div>
    )
  }

  if (data.reason === 'not_published') {
    return <PerfNote>انشر موقعك أولًا لتبدأ بيانات البحث بالتدفّق.</PerfNote>
  }
  if (data.reason === 'property_not_found') {
    return <AutoSetupCard site={site} expectedProperty={data.expectedProperty || site.url || ''} onDone={load} />
  }
  if (data.reason === 'no_data_yet') {
    return <PerfNote>الموقع مربوط ✓ — لا توجد مرّات ظهور بعد. يحتاج جوجل بضعة أيام بعد فهرسة الموقع. ارجع قريبًا.</PerfNote>
  }

  // ok — real data
  const t = data.totals!
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted">
        <BarChart3 className="h-3.5 w-3.5" /> آخر 28 يومًا · بيانات مباشرة من جوجل
        <button onClick={load} className="ms-auto inline-flex items-center gap-1 text-primary hover:underline">
          <RefreshCw className="h-3 w-3" /> تحديث
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="النقرات" value={fmtInt(t.clicks)} />
        <Stat label="مرّات الظهور" value={fmtInt(t.impressions)} />
        <Stat label="متوسط الترتيب" value={t.position ? t.position.toFixed(1) : '—'} />
        <Stat label="نسبة النقر (CTR)" value={`${(t.ctr * 100).toFixed(1)}%`} />
      </div>

      {data.queries && data.queries.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-token">
          <div className="border-b border-token bg-surface/50 px-3 py-2 text-[11px] font-semibold text-foreground">
            أكثر الكلمات التي يجدك بها الناس
          </div>
          <div className="divide-y divide-token">
            {data.queries.slice(0, 8).map((q, i) => (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11.5px]">
                <span className="min-w-0 truncate text-foreground" dir="auto">{q.query}</span>
                <span className="flex flex-shrink-0 items-center gap-3 tabular-nums text-muted">
                  <span title="نقرات">{fmtInt(q.clicks)} نقرة</span>
                  <span title="ظهور">{fmtInt(q.impressions)} ظهور</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * One-click Search Console setup. Calls /api/gsc/setup, which adds the property,
 * plants + verifies the ownership token on the live site, and submits the
 * sitemap — no manual Google steps. Reports honestly what happened, and offers
 * a manual fallback if auto-verify is still propagating or scopes are stale.
 */
function AutoSetupCard({
  site, expectedProperty, onDone,
}: {
  site: SeoSite
  expectedProperty: string
  onDone: () => void
}) {
  const notify = useNotify()
  const [status, setStatus] = useState<'idle' | 'running' | 'pending' | 'reconnect'>('idle')
  const [detail, setDetail] = useState<string | null>(null)

  const manualUrl = `https://search.google.com/search-console/welcome?resource_id=${encodeURIComponent(expectedProperty)}`

  async function run() {
    setStatus('running')
    setDetail(null)
    try {
      const r = await fetch('/api/gsc/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: site.id }),
      })
      const j = await r.json()
      if (j.ok) {
        notify.toast({ type: 'success', message: 'تم ربط الموقع بـ Search Console', description: 'أُضيف الموقع وتُحقّق منه وأُرسلت خريطته. ستظهر البيانات خلال يوم أو يومين.' })
        setStatus('idle')
        onDone()
        return
      }
      if (j.reason === 'reconnect_required') {
        setStatus('reconnect')
        return
      }
      if (j.reason === 'verify_pending' || j.reason === 'partial') {
        setStatus('pending')
        setDetail(j?.steps?.verified?.error || null)
        return
      }
      if (j.reason === 'not_published') {
        setStatus('idle')
        notify.toast({ type: 'warning', message: 'انشر الموقع أولًا', description: 'لا يمكن التحقّق من موقع غير منشور.' })
        return
      }
      setStatus('idle')
      notify.toast({ type: 'error', message: 'تعذّر الإعداد التلقائي', description: j?.error || 'حاول مرة أخرى، أو استخدم الطريقة اليدوية بالأسفل.' })
    } catch (e: any) {
      setStatus('idle')
      notify.toast({ type: 'error', message: 'تعذّر الإعداد التلقائي', description: e?.message })
    }
  }

  const running = status === 'running'

  return (
    <div className="mt-4 rounded-xl border border-token bg-surface/40 p-4">
      <div className="text-[12.5px] font-semibold text-foreground">اربط الموقع بـ Search Console تلقائيًا</div>
      <p className="mt-1 text-[11.5px] leading-[1.55] text-muted">
        حسابك مربوط. اضغط الزر وستتكفّل زينيا بكل شيء: إضافة الموقع كخاصية، إثبات الملكية، وإرسال خريطة الموقع — دون أي خطوة يدوية.
      </p>

      {status === 'reconnect' ? (
        <div className="mt-3">
          <p className="text-[11.5px] leading-[1.55] text-[#b45309]">
            الإعداد التلقائي يحتاج صلاحيات إضافية من جوجل. أعِد الربط مرة واحدة للسماح بالإضافة والتحقّق تلقائيًا.
          </p>
          <a
            href="/api/gsc/connect"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
          >
            <Link2 className="h-3.5 w-3.5" /> أعِد ربط جوجل لتفعيل الإعداد التلقائي
          </a>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {running ? 'جارٍ الإعداد…' : status === 'pending' ? 'أعد المحاولة' : 'اربط تلقائيًا الآن'}
          </button>

          {status === 'pending' && (
            <p className="mt-2 text-[11px] leading-[1.55] text-muted">
              خُزِّن رمز التحقّق على موقعك، لكن جوجل لم يلتقطه بعد (قد يستغرق دقيقة بعد النشر). أعد المحاولة بعد لحظات.
              {detail ? <span className="block opacity-70">({detail})</span> : null}
            </p>
          )}
        </>
      )}

      {/* Manual fallback — pre-filled Add-property deep link + copyable URL. */}
      <details className="mt-3 text-[11px] text-muted">
        <summary className="cursor-pointer hover:text-foreground">أو أضِفه يدويًا</summary>
        <div className="mt-2">
          <a href={manualUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> افتح «إضافة خاصية» في Search Console (الرابط مُعبّأ)
          </a>
          <div className="mt-2"><CopyRow value={expectedProperty} /></div>
        </div>
      </details>
    </div>
  )
}

function PerfNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-[rgba(94,106,210,0.06)] p-3 text-[11.5px] leading-[1.5] text-muted">
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-token bg-surface/40 px-3 py-2.5">
      <div className="text-[10.5px] font-medium text-muted">{label}</div>
      <div className="mt-0.5 text-[18px] font-bold tabular-nums tracking-tight text-foreground" dir="ltr">{value}</div>
    </div>
  )
}

function fmtInt(n: number): string {
  return Math.round(n || 0).toLocaleString('en-US')
}

/* ───────────────────────── copy row ───────────────────────── */

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-token bg-surface/50 p-2">
      <code dir="ltr" className="min-w-0 flex-1 truncate px-2 text-[12px] text-foreground">{value}</code>
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground"
        title="فتح"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[12px] font-medium text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'نُسخ' : 'نسخ'}
      </button>
    </div>
  )
}

/* ───────────────────────── empty state ───────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-2xl border border-token bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(94,106,210,0.10)]">
        <Globe className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-foreground">لا توجد مواقع بعد</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-[1.6] text-muted">
        أدوات السيو تعمل مع أي موقع منشور على زينيا (على عنوان اسمك.zenyaai.co) أو أي قالب عرض قيد الإعداد. أنشئ موقعًا أو انشر أحد قوالبك لتبدأ.
      </p>
      <Link
        href="/theme/new"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
      >
        أنشئ موقعًا <ArrowRight className="h-4 w-4 rotate-180" />
      </Link>
    </div>
  )
}
