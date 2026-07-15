'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Link2, Loader2, Check, ArrowRight, ArrowLeft, Wand2, RefreshCw,
  AlertCircle, Sparkles, Image as ImageIcon, Store, Tag, ShoppingBag,
  Download, Upload, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import {
  PALETTES, VIBE_LABELS, getPalette, type Palette, type PaletteVibe,
} from '@/lib/build/palettes'
import { collectClaims, type ThemeClaim } from '@/lib/build/seed'
import type { BuildConfig } from '@/lib/build/theme-generator'
import PhoneMockup from '@/components/build/PhoneMockup'
import ComingSoon from '@/components/build/ComingSoon'

type Step = 1 | 2 | 3 | 4

type ScrapedReview = {
  name: string
  country?: string
  rating: number
  text: string
  photos?: string[]
  date?: string
}

type PublishResult = {
  status: number
  ok?: boolean
  error?: string
  message?: string
  authUrl?: string
  theme?: {
    id: string
    name: string
    processing: boolean
    previewUrl: string
    editorUrl: string
    themesUrl: string
  }
  product?: { id: number | string; handle?: string | null; adminUrl: string } | null
  productError?: string | null
}

type Scraped = {
  name: string
  description: string
  images: string[]
  price?: number | null
  originalPrice?: number | null
  productFacts?: {
    highlights?: string[]
    specs?: Record<string, string>
    longDescription?: string
  } | null
  /** Real reviews pulled from the source listing (AliExpress). */
  reviews?: ScrapedReview[]
  reviewStats?: { average: number; count: number } | null
}

const STEP_LABELS: Record<Step, { name: string; sub: string }> = {
  1: { name: 'رابط المنتج',   sub: 'الصق رابطًا للبدء' },
  2: { name: 'معلومات المنتج', sub: 'اختر الصور وحدّد التفاصيل' },
  3: { name: 'الألوان',        sub: 'اختر مظهر متجرك' },
  4: { name: 'التوليد',        sub: 'أنشئ قالب Shopify' },
}

const MIN_IMAGES = 5

export default function BuildPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checkingAuth, setCheckingAuth] = useState(true)
  // The one-product builder is admin-only while the new version is in the
  // works; everyone else sees the ComingSoon screen.
  const [isAdmin, setIsAdmin] = useState(false)

  const [step, setStep] = useState<Step>(1)

  // Surfaced when the Shopify OAuth callback redirects back here on failure
  // (the connect happens in a popped tab, which lands on /build?shopify_error).
  const [shopifyError, setShopifyError] = useState<string | null>(null)
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get('shopify_error')
    if (e) setShopifyError(e)
  }, [])

  // Step 1
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Step 2
  const [scraped, setScraped] = useState<Scraped | null>(null)
  const [productName, setProductName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [aiNames, setAiNames] = useState<string[] | null>(null)
  const [aiNaming, setAiNaming] = useState(false)
  const [aiNameError, setAiNameError] = useState<string | null>(null)

  // Step 3
  const [paletteId, setPaletteId] = useState<string>(PALETTES[0].id)

  // Honesty gate (between product info and colors): the user must
  // acknowledge that parts of the theme are AI-invented before
  // continuing. The acknowledgment is recorded server-side.
  const [honestyOpen, setHonestyOpen] = useState(false)
  const [honestyAcked, setHonestyAcked] = useState(false)
  const [ackSending, setAckSending] = useState(false)

  // Step 4
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState<string | null>(null)

  const palette = useMemo(() => getPalette(paletteId), [paletteId])

  /* ── Auth gate ──────────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      if (!user) {
        router.replace('/login?mode=signup&next=/build')
        return
      }
      // Read the caller's own plan (RLS allows "view own profile") to decide
      // whether to open the builder or show the coming-soon gate.
      const { data: prof } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle()
      if (!alive) return
      setIsAdmin(prof?.plan === 'admin')
      setCheckingAuth(false)
    })()
    return () => { alive = false }
  }, [router, supabase])

  /* ── Step 1: analyze URL ────────────────────────────────────────── */
  async function analyze() {
    const u = url.trim()
    if (!u) return
    if (!/^https?:\/\//i.test(u)) {
      setAnalyzeError('أضف ‎http://‎ أو ‎https://‎ في بداية الرابط.')
      return
    }
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const r = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      })
      const j = await r.json()
      if (!r.ok || j?.error) {
        setAnalyzeError(j?.message || 'تعذّر علينا قراءة تلك الصفحة. بعض المتاجر تحجب أدوات الاستخراج — جرّب رابط منتج آخر.')
        return
      }
      const s: Scraped = {
        name: j.name || '',
        description: j.description || '',
        images: Array.isArray(j.images) ? j.images : [],
        price: typeof j.price === 'number' ? j.price : null,
        originalPrice: typeof j.originalPrice === 'number' ? j.originalPrice : null,
        productFacts: j.productFacts || null,
        reviews: Array.isArray(j.reviews) ? j.reviews : [],
        reviewStats: j.reviewStats || null,
      }
      setScraped(s)
      setProductName(s.name)
      // Reasonable defaults for the price pair — if scraper gave us
      // both, use them; otherwise leave the fields blank so the user
      // makes a conscious choice instead of pricing off a guess.
      setSalePrice(s.price != null ? String(s.price) : '')
      setOriginalPrice(s.originalPrice != null ? String(s.originalPrice) : '')
      // Pre-select the first 5 images as a starting point — user can
      // toggle from here. Saves a click for the happy path.
      setSelectedImages(s.images.slice(0, MIN_IMAGES))
      setStep(2)
    } catch (e: any) {
      setAnalyzeError(e?.message || 'خطأ في الشبكة. حاول مجددًا.')
    } finally {
      setAnalyzing(false)
    }
  }

  /* ── Step 2: image toggle + AI name gen ─────────────────────────── */
  function toggleImage(src: string) {
    setSelectedImages((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src],
    )
  }

  async function suggestNames() {
    if (aiNaming) return
    setAiNaming(true)
    setAiNameError(null)
    try {
      const r = await fetch('/api/ai/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scraped_name: scraped?.name,
          description: scraped?.description,
          highlights: scraped?.productFacts?.highlights || [],
          vibe: palette.vibe,
        }),
      })
      const j = await r.json()
      if (!r.ok || !Array.isArray(j?.names)) {
        setAiNameError(j?.message || 'التسمية بالذكاء الاصطناعي غير متاحة حاليًا.')
        return
      }
      setAiNames(j.names)
    } catch (e: any) {
      setAiNameError(e?.message || 'خطأ في الشبكة')
    } finally {
      setAiNaming(false)
    }
  }

  /* ── Step 4: generate + download the Shopify theme ──────────────── */
  async function generate() {
    setGenerating(true)
    setGenerateMsg(null)
    try {
      // Cache the build snapshot in localStorage so a refresh mid-
      // download doesn't lose work. Same key the dashboard will use
      // when we add "resume your draft" later.
      const snapshot = {
        url, productName, storeName,
        originalPrice: Number(originalPrice) || 0,
        salePrice: Number(salePrice) || 0,
        selectedImages, paletteId,
        savedAt: new Date().toISOString(),
      }
      try { localStorage.setItem('zenya:build:draft', JSON.stringify(snapshot)) } catch {}

      // Ask the server to produce the .zip. The server resolves the
      // palette from id so the merchant can't smuggle a custom palette.
      const r = await fetch('/api/build/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          storeName,
          salePrice: Number(salePrice) || 0,
          originalPrice: Number(originalPrice) || 0,
          images: selectedImages,
          paletteId,
          description: scraped?.description || '',
          highlights: scraped?.productFacts?.highlights || [],
          specs: scraped?.productFacts?.specs || {},
          sourceUrl: url,
          reviews: scraped?.reviews || [],
          reviewStats: scraped?.reviewStats || null,
        }),
      })
      if (!r.ok) {
        let msg = 'تعذّر توليد القالب.'
        try { msg = (await r.json())?.message || msg } catch {}
        setGenerateMsg('error:' + msg)
        return
      }

      // Stream the blob to a hidden <a> and click it. Browsers
      // download cleanly without leaving us a half-baked blob URL.
      const blob = await r.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      const safeStore = (storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store'
      a.download = `${safeStore}-zenya-theme.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revoke after a beat so Safari has time to actually start the
      // download — revoking too eagerly cancels it.
      setTimeout(() => URL.revokeObjectURL(href), 4_000)
      setGenerateMsg('downloaded')
    } catch (e: any) {
      setGenerateMsg('error:' + (e?.message || 'خطأ في الشبكة'))
    } finally {
      setGenerating(false)
    }
  }

  /* ── One-click publish: theme + product straight into Shopify ───── */
  async function publishToShopify(shopDomain: string): Promise<PublishResult> {
    try {
      const r = await fetch('/api/build/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: shopDomain,
          productName,
          storeName,
          salePrice: Number(salePrice) || 0,
          originalPrice: Number(originalPrice) || 0,
          images: selectedImages,
          paletteId,
          description: scraped?.description || '',
          highlights: scraped?.productFacts?.highlights || [],
          specs: scraped?.productFacts?.specs || {},
          sourceUrl: url,
          reviews: scraped?.reviews || [],
          reviewStats: scraped?.reviewStats || null,
        }),
      })
      const j = await r.json()
      return { status: r.status, ...j }
    } catch (e: any) {
      return { status: 0, error: 'network', message: e?.message || 'خطأ في الشبكة' }
    }
  }

  /* ── Step gates (what's allowed to advance) ─────────────────────── */
  const canStep2Next =
    selectedImages.length >= MIN_IMAGES &&
    productName.trim().length > 0 &&
    storeName.trim().length > 0 &&
    Number(salePrice) > 0
  const priceDiscount =
    Number(originalPrice) > Number(salePrice) && Number(originalPrice) > 0
      ? Math.round(((Number(originalPrice) - Number(salePrice)) / Number(originalPrice)) * 100)
      : 0

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    )
  }

  // Non-admins: the builder is behind a "big new version coming" gate.
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <header className="border-b border-token bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4 text-[14px] font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            متجر المنتج الواحد
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6">
          <ComingSoon onBack={() => router.push('/themes')} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-token bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            أنشئ متجر منتج واحد
          </div>
          <div className="text-[12.5px] text-muted">
            الخطوة {step} من 4 · {STEP_LABELS[step].name}
          </div>
        </div>
        <StepNav step={step} onJump={(s) => {
          // Only allow jumping back, never forward past a gate.
          if (s < step) setStep(s)
        }} />
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {shopifyError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-4 py-3 text-[12.5px] text-[#b91c1c]">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              تعذّر إكمال الربط مع Shopify. أغلِق نافذة Shopify وحاول الضغط على «اتصال» مرة أخرى.
              إن تكرّر الأمر، تأكّد من أنك سجّلت الدخول إلى المتجر الصحيح.
            </span>
            <button
              type="button"
              onClick={() => setShopifyError(null)}
              className="ms-auto flex-shrink-0 text-[11px] font-semibold text-[#b91c1c] underline-offset-2 hover:underline"
            >
              إخفاء
            </button>
          </div>
        )}
        {step === 1 && (
          <UrlStep
            url={url}
            onUrl={setUrl}
            analyzing={analyzing}
            error={analyzeError}
            onAnalyze={analyze}
          />
        )}

        {step === 2 && scraped && (
          <ProductStep
            scraped={scraped}
            productName={productName}
            onProductName={setProductName}
            storeName={storeName}
            onStoreName={setStoreName}
            originalPrice={originalPrice}
            onOriginalPrice={setOriginalPrice}
            salePrice={salePrice}
            onSalePrice={setSalePrice}
            priceDiscount={priceDiscount}
            selectedImages={selectedImages}
            onToggleImage={toggleImage}
            aiNames={aiNames}
            aiNaming={aiNaming}
            aiNameError={aiNameError}
            onSuggestNames={suggestNames}
            onPickName={(n) => { setProductName(n); setAiNames(null) }}
            onCloseAiPanel={() => setAiNames(null)}
            canNext={canStep2Next}
            onBack={() => setStep(1)}
            onNext={() => {
              if (honestyAcked) setStep(3)
              else setHonestyOpen(true)
            }}
          />
        )}

        {step === 3 && (
          <ColorStep
            palette={palette}
            paletteId={paletteId}
            onPalette={setPaletteId}
            productName={productName || scraped?.name || 'منتجك'}
            storeName={storeName || 'متجرك'}
            price={Number(salePrice) || 0}
            originalPrice={Number(originalPrice) || 0}
            heroImage={selectedImages[0]}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <GenerateStep
            productName={productName}
            storeName={storeName}
            palette={palette}
            price={Number(salePrice) || 0}
            originalPrice={Number(originalPrice) || 0}
            images={selectedImages}
            heroImage={selectedImages[0]}
            reviews={scraped?.reviews || []}
            reviewStats={scraped?.reviewStats || null}
            specs={scraped?.productFacts?.specs || null}
            generating={generating}
            generateMsg={generateMsg}
            onBack={() => setStep(3)}
            onGenerate={generate}
            onPublish={publishToShopify}
            onGoDashboard={() => router.push('/dashboard/sites')}
          />
        )}
      </main>

      {honestyOpen && (
        <HonestyGateModal
          reviews={scraped?.reviews || []}
          reviewStats={scraped?.reviewStats || null}
          specs={scraped?.productFacts?.specs || null}
          sending={ackSending}
          onClose={() => setHonestyOpen(false)}
          onAcknowledge={async (claimIds) => {
            setAckSending(true)
            try {
              await fetch('/api/build/acknowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productName,
                  storeName,
                  sourceUrl: url,
                  claimIds,
                }),
              })
            } catch {
              // Recording failed — don't block the user's flow over it.
            } finally {
              setAckSending(false)
              setHonestyAcked(true)
              setHonestyOpen(false)
              setStep(3)
            }
          }}
        />
      )}
    </div>
  )
}

/* ─── Step nav ─────────────────────────────────────────────────────── */

function StepNav({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  const order: Step[] = [1, 2, 3, 4]
  return (
    <div className="border-t border-token bg-[#fafaf7]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3 overflow-x-auto">
        {order.map((s, i) => {
          const done = s < step
          const active = s === step
          return (
            <div key={s} className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => done && onJump(s)}
                disabled={!done}
                className={
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ' +
                  (active
                    ? 'bg-primary text-white shadow-sm'
                    : done
                      ? 'bg-white text-foreground border border-token hover:bg-black/5 cursor-pointer'
                      : 'bg-transparent text-muted')
                }
              >
                <span
                  className={
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-bold ' +
                    (active
                      ? 'bg-white/20 text-white'
                      : done
                        ? 'bg-primary/10 text-primary'
                        : 'bg-[var(--border)] text-muted')
                  }
                >
                  {done ? <Check className="h-3 w-3" /> : s}
                </span>
                <span className="whitespace-nowrap">{STEP_LABELS[s].name}</span>
              </button>
              {i < order.length - 1 && (
                <div className="h-px w-8 bg-[var(--border)]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 1: URL ──────────────────────────────────────────────────── */

function UrlStep({
  url, onUrl, analyzing, error, onAnalyze,
}: {
  url: string
  onUrl: (s: string) => void
  analyzing: boolean
  error: string | null
  onAnalyze: () => void
}) {
  // Ask up-front whether the user already has a Shopify store. If they do,
  // connecting is the easy path (one-click install + product creation at the
  // end); if not, they just generate + download a .zip here. Purely
  // informational — it never blocks pasting a URL and generating.
  const [hasStore, setHasStore] = useState<'yes' | 'no' | null>(null)
  const shopifyAffiliate = 'https://www.shopify.com/free-trial?ref=zenya-ai'

  return (
    <div className="mx-auto max-w-2xl">
      {/* Store question — sets expectations before the wizard begins */}
      <div className="mb-5 rounded-3xl border border-token bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Store className="h-5 w-5 text-primary" strokeWidth={2.1} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-foreground">هل لديك متجر Shopify؟</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              إن كان لديك متجر، فأسهل طريقة أن تربط زينيا به — سنثبّت القالب وننشئ المنتج
              تلقائيًا بنقرة واحدة في نهاية الخطوات، دون أي رفع يدوي.
            </p>

            {hasStore === null && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHasStore('yes')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white transition hover:scale-[1.02]"
                >
                  <Store className="h-4 w-4" /> نعم، لديّ متجر
                </button>
                <button
                  type="button"
                  onClick={() => setHasStore('no')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition hover:bg-black/5"
                >
                  لا، سأكمل هنا
                </button>
              </div>
            )}

            {hasStore === 'yes' && (
              <div className="mt-3 rounded-xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.05)] p-3.5 text-[12.5px]">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Upload className="h-4 w-4 text-[#15803d]" /> رائع — سنربط متجرك في الخطوة الأخيرة
                </div>
                <p className="mt-1 leading-relaxed text-muted">
                  الصق رابط المنتج بالأسفل وأكمل الخطوات. عند التوليد، اربط متجرك مرة واحدة
                  وستتكفّل زينيا بالباقي: تثبيت القالب وإنشاء المنتج تلقائيًا — بلا تنزيل ولا رفع يدوي.
                </p>
                <button
                  type="button"
                  onClick={() => setHasStore(null)}
                  className="mt-1.5 text-[11.5px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  → تغيير الإجابة
                </button>
              </div>
            )}

            {hasStore === 'no' && (
              <div className="mt-3 rounded-xl border border-token bg-[#fafaf7] p-3.5 text-[12.5px]">
                <p className="leading-relaxed text-muted">
                  لا مشكلة — أكمل هنا وسنولّد لك قالبًا كاملاً تنزّله كملف ‎.zip‎ جاهز لـ Shopify.
                  تحتاج متجرًا لاحقًا؟ ابدأ تجربة Shopify مجانية وعُد لرفعه بنقرة.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={shopifyAffiliate}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-[12.5px] font-semibold text-white transition hover:scale-[1.02]"
                  >
                    ابدأ تجربة Shopify المجانية <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setHasStore(null)}
                    className="text-[11.5px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
                  >
                    → تغيير الإجابة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-token bg-white p-10 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Link2 className="h-5 w-5 text-primary" strokeWidth={2.2} />
        </div>
        <h1 className="mt-5 text-[26px] font-bold tracking-tight text-foreground">
          ابدأ برابط منتج
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          الصق أي رابط منتج — Shopify أو AliExpress أو Amazon أو متجر مستقل، من أي مكان. نستخرج الاسم
          والصور والوصف والسعر حتى لا تضطر لإعادة كتابة أي شيء.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); onAnalyze() }}
          className="mt-7 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              dir="ltr"
              value={url}
              onChange={(e) => onUrl(e.target.value)}
              placeholder="https://example.com/products/cool-thing"
              className="w-full rounded-full border border-token bg-surface py-3 pl-10 pr-4 text-[14px] text-foreground outline-none transition focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={analyzing || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ التحليل…
              </>
            ) : (
              <>
                ابدأ التحليل
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12.5px] text-[#b91c1c]">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {analyzing && !error && (
          <div className="mt-6 space-y-2 text-[12.5px] text-muted">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              جارٍ جلب صفحة المنتج…
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:200ms]" />
              جارٍ استخراج الصور والاسم والسعر…
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:400ms]" />
              جارٍ قراءة الوصف…
            </div>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-token bg-[#fafaf7] p-4 text-[12.5px] text-muted">
          <strong className="text-foreground">نصيحة:</strong> صفحات منتجات Shopify تمنحنا أفضل
          البيانات. ونتعامل أيضًا مع AliExpress وAmazon وأي واجهة متجر تنشر بيانات منتج بصيغة
          Open Graph أو JSON-LD.
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2: Product editor ───────────────────────────────────────── */

function ProductStep(props: {
  scraped: Scraped
  productName: string
  onProductName: (s: string) => void
  storeName: string
  onStoreName: (s: string) => void
  originalPrice: string
  onOriginalPrice: (s: string) => void
  salePrice: string
  onSalePrice: (s: string) => void
  priceDiscount: number
  selectedImages: string[]
  onToggleImage: (src: string) => void
  aiNames: string[] | null
  aiNaming: boolean
  aiNameError: string | null
  onSuggestNames: () => void
  onPickName: (n: string) => void
  onCloseAiPanel: () => void
  canNext: boolean
  onBack: () => void
  onNext: () => void
}) {
  const {
    scraped, productName, onProductName, storeName, onStoreName,
    originalPrice, onOriginalPrice, salePrice, onSalePrice, priceDiscount,
    selectedImages, onToggleImage, aiNames, aiNaming, aiNameError,
    onSuggestNames, onPickName, onCloseAiPanel, canNext, onBack, onNext,
  } = props
  const selectedCount = selectedImages.length
  const minOk = selectedCount >= MIN_IMAGES

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          خصّصه
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          اختر {MIN_IMAGES} صور على الأقل، وحسّن اسم المنتج، وأضف تفاصيل متجرك.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Image picker */}
        <section className="lg:col-span-3 rounded-2xl border border-token bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-foreground">اختر صورك</h2>
            </div>
            <div
              className={
                'rounded-full px-2.5 py-1 text-[11px] font-semibold ' +
                (minOk
                  ? 'bg-[rgba(21,128,61,0.10)] text-[#15803d]'
                  : 'bg-[rgba(94,106,210,0.10)] text-primary')
              }
            >
              {selectedCount} من {MIN_IMAGES} كحد أدنى{minOk ? ' ✓' : ''}
            </div>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            أول صورة تختارها تصبح الصورة الرئيسية. انقر للتبديل.
          </p>

          {scraped.images.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-token bg-[#fafaf7] p-6 text-center text-[12.5px] text-muted">
              لم نجد صورًا في تلك الصفحة. جرّب رابط منتج آخر.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {scraped.images.map((src, i) => {
                const sel = selectedImages.indexOf(src)
                const isSelected = sel !== -1
                return (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => onToggleImage(src)}
                    className={
                      'group relative aspect-square overflow-hidden rounded-xl border-2 transition ' +
                      (isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-token hover:border-foreground/30')
                    }
                  >
                    <Image src={src} alt="" fill sizes="160px" className="object-cover" unoptimized />
                    {isSelected && (
                      <div className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md">
                        <span className="text-[11px] font-bold">{sel + 1}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Form */}
        <section className="lg:col-span-2 space-y-4">
          {/* Product name + AI gen */}
          <div className="rounded-2xl border border-token bg-white p-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              اسم المنتج
            </label>
            <div className="mt-2 flex items-stretch gap-2">
              <input
                value={productName}
                onChange={(e) => onProductName(e.target.value)}
                placeholder="اسم منتجك"
                className="flex-1 rounded-lg border border-token bg-surface px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-primary"
              />
              <button
                type="button"
                onClick={onSuggestNames}
                disabled={aiNaming}
                title="اقترح أسماء بالذكاء الاصطناعي"
                className="inline-flex items-center gap-1 rounded-lg border border-token bg-white px-3 py-2.5 text-[12.5px] font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-50"
              >
                {aiNaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-primary" />}
                {aiNaming ? 'يفكّر…' : 'تسمية تلقائية'}
              </button>
            </div>

            {aiNameError && (
              <div className="mt-2 text-[11.5px] text-[#b91c1c]">{aiNameError}</div>
            )}

            {aiNames && aiNames.length > 0 && (
              <div className="mt-3 rounded-xl border border-token bg-[#fafaf7] p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <span>اقتراحات الذكاء الاصطناعي · انقر للاستخدام</span>
                  <button
                    type="button"
                    onClick={onCloseAiPanel}
                    className="rounded text-[10px] text-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aiNames.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onPickName(n)}
                      className="rounded-full border border-token bg-white px-3 py-1 text-[12px] font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onSuggestNames}
                    disabled={aiNaming}
                    className="rounded-full px-3 py-1 text-[11.5px] font-medium text-muted hover:text-foreground"
                  >
                    <RefreshCw className="me-1 inline h-3 w-3" />
                    المزيد
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Store name */}
          <div className="rounded-2xl border border-token bg-white p-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Store className="me-1 inline h-3 w-3" /> اسم المتجر
            </label>
            <input
              value={storeName}
              onChange={(e) => onStoreName(e.target.value)}
              placeholder="مثلاً: متجر نور"
              className="mt-2 w-full rounded-lg border border-token bg-surface px-3 py-2.5 text-[14px] text-foreground outline-none transition focus:border-primary"
            />
            <p className="mt-1.5 text-[11.5px] text-muted">
              يظهر في الترويسة والسلّة والتذييل.
            </p>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-token bg-white p-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Tag className="me-1 inline h-3 w-3" /> التسعير
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[10.5px] font-medium text-muted">السعر الأصلي</div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">$</span>
                  <input
                    dir="ltr"
                    value={originalPrice}
                    onChange={(e) => onOriginalPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="99.99"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-token bg-surface py-2.5 pl-7 pr-3 text-[14px] text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 text-[10.5px] font-medium text-muted">سعر العرض</div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">$</span>
                  <input
                    dir="ltr"
                    value={salePrice}
                    onChange={(e) => onSalePrice(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="49.99"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-token bg-surface py-2.5 pl-7 pr-3 text-[14px] text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>
            </div>
            {priceDiscount > 0 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                خصم {priceDiscount}٪ يظهر للمتسوّقين
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 border-t border-token pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" /> رجوع
        </button>
        <div className="text-[12px] text-muted">
          {canNext ? 'جاهز لاختيار الألوان' : `تحتاج ${Math.max(0, MIN_IMAGES - selectedCount)} صورة إضافية + الاسم والمتجر وسعر العرض.`}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          اختر الألوان <ArrowRight className="h-4 w-4 rtl-flip" />
        </button>
      </div>
    </div>
  )
}

/* ─── Step 3: Color picker ─────────────────────────────────────────── */

function ColorStep({
  palette, paletteId, onPalette,
  productName, storeName, price, originalPrice, heroImage,
  onBack, onNext,
}: {
  palette: Palette
  paletteId: string
  onPalette: (id: string) => void
  productName: string
  storeName: string
  price: number
  originalPrice: number
  heroImage?: string
  onBack: () => void
  onNext: () => void
}) {
  const groups: PaletteVibe[] = ['bold', 'premium', 'dark', 'warm']
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          اختر مظهر متجرك
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          انقر لوحة ألوان — تتحدّث معاينة الهاتف فورًا.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Sticky phone preview */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-token bg-white p-6 flex flex-col items-center">
            <PhoneMockup
              palette={palette}
              productName={productName}
              storeName={storeName}
              price={price}
              originalPrice={originalPrice}
              heroImage={heroImage}
            />
            <div className="mt-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {VIBE_LABELS[palette.vibe].name}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-foreground">{palette.name}</div>
              <div className="mt-1 text-[12px] text-muted">{palette.blurb}</div>
            </div>
          </div>
        </div>

        {/* Palette groups */}
        <div className="lg:col-span-3 space-y-6">
          {groups.map((vibe) => (
            <section key={vibe}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[14px] font-semibold text-foreground">
                  {VIBE_LABELS[vibe].name}
                </h2>
                <span className="text-[11.5px] text-muted">{VIBE_LABELS[vibe].blurb}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PALETTES.filter((p) => p.vibe === vibe).map((p) => {
                  const active = p.id === paletteId
                  return (
                    <PaletteTile
                      key={p.id}
                      palette={p}
                      active={active}
                      onClick={() => onPalette(p.id)}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 border-t border-token pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" /> رجوع
        </button>
        <div className="text-[12px] text-muted">{palette.name} محدّدة</div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:scale-[1.02]"
        >
          توليد <ArrowRight className="h-4 w-4 rtl-flip" />
        </button>
      </div>
    </div>
  )
}

function PaletteTile({
  palette: p, active, onClick,
}: {
  palette: Palette
  active: boolean
  onClick: () => void
}) {
  // Card uses the palette's own bg + fg so the user feels the look
  // instead of guessing from a tiny widget. Three swatches at the top
  // (primary / accent / surface — the colours the eye lands on first),
  // vibe label in the accent colour, name in display weight, blurb
  // under it. Selected state is a subtle outline + corner badge.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'group relative w-full overflow-hidden rounded-2xl border p-5 text-start transition focus:outline-none ' +
        (active
          ? 'shadow-[0_0_0_2px_var(--color-primary)] ring-0'
          : 'border-token hover:-translate-y-0.5 hover:shadow-md')
      }
      style={{
        background: p.bg,
        color: p.fg,
        borderColor: active ? p.primary : p.border,
        minHeight: 168,
      }}
    >
      {/* Swatch row */}
      <div className="flex items-center gap-2">
        {[p.primary, p.accent, p.surface].map((c, i) => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: 22,
              height: 22,
              background: c,
              border: `1px solid ${p.border}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
            aria-hidden
          />
        ))}
      </div>

      {/* SELECTED chip */}
      {active && (
        <div
          className="absolute end-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{
            background: p.primary,
            color: p.primaryFg,
          }}
        >
          محدّدة
        </div>
      )}

      {/* Vibe label */}
      <div
        className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: p.accent }}
      >
        {VIBE_LABELS[p.vibe].name}
      </div>

      {/* Display name */}
      <div
        className="mt-1 text-[22px] font-bold tracking-tight"
        style={{ color: p.fg, fontFamily: 'ui-serif, Georgia, "Times New Roman", serif', letterSpacing: '-0.01em', lineHeight: 1.1 }}
      >
        {p.name}
      </div>

      {/* Blurb */}
      <div
        className="mt-2 text-[12.5px] leading-[1.45]"
        style={{ color: p.muted }}
      >
        {p.blurb}
      </div>
    </button>
  )
}

/* ─── Step 4: Generate ─────────────────────────────────────────────── */

function GenerateStep({
  productName, storeName, palette, price, originalPrice, images, heroImage,
  reviews, reviewStats, specs, generating, generateMsg, onBack, onGenerate, onPublish, onGoDashboard,
}: {
  productName: string
  storeName: string
  palette: Palette
  price: number
  originalPrice: number
  images: string[]
  heroImage?: string
  reviews: ScrapedReview[]
  reviewStats: { average: number; count: number } | null
  specs: Record<string, string> | null
  generating: boolean
  generateMsg: string | null
  onBack: () => void
  onGenerate: () => void
  onPublish: (shop: string) => Promise<PublishResult>
  onGoDashboard: () => void
}) {
  const downloaded = generateMsg === 'downloaded'
  const realReviewCount = reviews.filter((r) => r.text && r.text.length >= 8).length
  const realPhotoCount = reviews.reduce((a, r) => a + (r.photos?.length || 0), 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          {downloaded ? 'قالبك جاهز' : 'أنت جاهز للتوليد'}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          {downloaded
            ? 'عاينه أدناه، ثم ادفعه إلى Shopify أو نزّل ملف ‎.zip‎.'
            : 'راجع التصميم، ثم سننشئ قالب Shopify الكامل.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Summary / publish controls */}
        <div className="lg:col-span-3 space-y-4">
          {downloaded ? (
            <PublishPanel
              productName={productName}
              storeName={storeName}
              onGenerate={onGenerate}
              generating={generating}
              onPublish={onPublish}
            />
          ) : (
            <>
              <div className="rounded-2xl border border-token bg-white p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <ShoppingBag className="h-3 w-3" /> المنتج
                </div>
                <div className="mt-2 text-[18px] font-bold text-foreground">{productName || 'منتج بلا اسم'}</div>
                <div className="mt-1 text-[13px] text-muted">في <strong className="text-foreground">{storeName || 'متجرك'}</strong></div>
                {realReviewCount >= 3 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(21,128,61,0.10)] px-2.5 py-1 text-[11px] font-semibold text-[#15803d]">
                    <Check className="h-3 w-3" />
                    {realReviewCount} تقييم حقيقي مستورد{realPhotoCount > 0 ? ` · ${realPhotoCount} صورة من العملاء` : ''}
                    {reviewStats ? ` · ${reviewStats.average.toFixed(1)}★ من ${reviewStats.count.toLocaleString()} تقييم` : ''}
                  </div>
                )}
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="text-[22px] font-bold" style={{ color: palette.primary }}>${price.toFixed(2)}</div>
                  {originalPrice > price && (
                    <>
                      <div className="text-[13px] text-muted line-through">${originalPrice.toFixed(2)}</div>
                      <div className="rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                        وفّر ${(originalPrice - price).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-token bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {images.length} صورة محدّدة
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.slice(0, 10).map((src) => (
                    <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-token bg-surface">
                      <Image src={src} alt="" fill sizes="80px" className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-token bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Palette</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex">
                    {[palette.bg, palette.surface, palette.primary, palette.accent, palette.fg].map((c, i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white shadow-sm -ms-2 first:ms-0" style={{ background: c }} />
                    ))}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-foreground">{palette.name}</div>
                    <div className="text-[12px] text-muted">{VIBE_LABELS[palette.vibe].name}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview — always visible so the user can see what they got */}
        <div className="lg:col-span-2 flex flex-col items-center rounded-3xl border border-token bg-white p-6">
          {downloaded && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(21,128,61,0.10)] px-2.5 py-1 text-[11px] font-semibold text-[#15803d]">
              <Check className="h-3 w-3" /> تم التوليد
            </div>
          )}
          <PhoneMockup
            palette={palette}
            productName={productName || 'منتجك'}
            storeName={storeName || 'متجرك'}
            price={price}
            originalPrice={originalPrice}
            heroImage={heroImage}
          />
          <div className="mt-4 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {VIBE_LABELS[palette.vibe].name}
            </div>
            <div className="text-[14px] font-bold text-foreground">{palette.name}</div>
            <div className="mt-1 text-[11.5px] text-muted">صفحة المنتج · معاينة حيّة</div>
          </div>
        </div>
      </div>

      {/* Honesty check — everything the AI invented that the merchant
          must verify before launch. Always visible at this step. */}
      <ClaimsPanel reviews={reviews} reviewStats={reviewStats} specs={specs} />

      {/* Generate CTA (pre-download only) */}
      {!downloaded && (
        <div className="rounded-3xl border border-token bg-white p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 text-[20px] font-bold text-foreground">
              أنشئ قالب Shopify الكامل
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-muted">
              سنولّد كل صفحة وقسم — الواجهة الرئيسية والحزم والعروض الإضافية والتقييمات والأسئلة الشائعة
              وزر الإضافة للسلّة الثابت، وكل شيء — ونسلّمك قالبًا جاهزًا لـ Shopify.
            </p>
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ التوليد…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  ولّد ونزّل ملف ‎.zip‎
                </>
              )}
            </button>
            {generateMsg && generateMsg.startsWith('error:') && (
              <div className="mx-auto mt-4 max-w-md rounded-xl border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12.5px] text-[#b91c1c]">
                {generateMsg.slice(6)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 border-t border-token pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" /> العودة للألوان
        </button>
        {downloaded && (
          <button
            type="button"
            onClick={onGoDashboard}
            className="inline-flex items-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
          >
            لوحة التحكم <ArrowRight className="h-4 w-4 rtl-flip" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Honesty gate modal (between product info and colors) ─────────── */

function HonestyGateModal({
  reviews, reviewStats, specs, sending, onClose, onAcknowledge,
}: {
  reviews: ScrapedReview[]
  reviewStats: { average: number; count: number } | null
  specs: Record<string, string> | null
  sending: boolean
  onClose: () => void
  onAcknowledge: (claimIds: string[]) => void
}) {
  const claims: ThemeClaim[] = useMemo(
    () => collectClaims({ reviews, reviewStats: reviewStats || undefined, specs: specs || undefined } as unknown as BuildConfig),
    [reviews, reviewStats, specs],
  )
  const high = claims.filter((c) => c.severity === 'high')
  const medium = claims.filter((c) => c.severity === 'medium')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="إشعار بمحتوى مولَّد بالذكاء الاصطناعي"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-token bg-[rgba(217,119,6,0.05)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(217,119,6,0.12)]">
              <AlertCircle className="h-5 w-5 text-[#d97706]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-foreground">تنبيه — أجزاء من هذا القالب من اختراع الذكاء الاصطناعي</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                {high.length} يجب إصلاحها · {medium.length} للتحقق منها. أنت وحدك من يجعلها حقيقية قبل الإطلاق.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="space-y-2.5">
            {[...high, ...medium].map((cl) => (
              <li key={cl.id} className="rounded-xl border border-token bg-[#fafaf7] p-3.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      cl.severity === 'high' ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">{cl.location}</div>
                    <div className="mt-0.5 text-[13px] font-semibold text-foreground">{cl.claim}</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-muted">{cl.why}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-token bg-white px-6 py-4">
          <p className="mb-3 text-[12px] leading-relaxed text-muted">
            بالمتابعة، تُقرّ بأن أعداد المخزون وإشعارات المشترين واقتباسات الصحافة ونماذج التقييمات
            وما شابهها في القالب المولَّد هي أمثلة مولَّدة بالذكاء الاصطناعي — وليست معلومات حقيقية —
            وأن مسؤوليتك استبدالها أو التحقق منها قبل النشر.
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-black/5"
            >
              رجوع
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => onAcknowledge(claims.map((c) => c.id))}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              فهمت — أكمل
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Honesty check panel ──────────────────────────────────────────── */

function ClaimsPanel({
  reviews, reviewStats, specs,
}: {
  reviews: ScrapedReview[]
  reviewStats: { average: number; count: number } | null
  specs: Record<string, string> | null
}) {
  const [open, setOpen] = useState(false)
  // collectClaims only reads the review/spec fields — the rest of the
  // config doesn't change which claims are raised.
  const claims: ThemeClaim[] = useMemo(
    () => collectClaims({ reviews, reviewStats: reviewStats || undefined, specs: specs || undefined } as unknown as BuildConfig),
    [reviews, reviewStats, specs],
  )
  const high = claims.filter((c) => c.severity === 'high')
  const medium = claims.filter((c) => c.severity === 'medium')

  return (
    <div className="rounded-2xl border border-[rgba(217,119,6,0.25)] bg-[rgba(217,119,6,0.04)] p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(217,119,6,0.12)]">
            <AlertCircle className="h-4.5 w-4.5 text-[#d97706]" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-foreground">
              فحص المصداقية — ما اخترعه الذكاء الاصطناعي
            </div>
            <div className="mt-0.5 text-[12px] text-muted">
              {high.length} يجب إصلاحها · {medium.length} للتحقق منها قبل الإطلاق. أعداد المخزون وأسماء المشترين
              واقتباسات الصحافة — أمور أنت وحدك من يجعلها حقيقية.
            </div>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full border border-token bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground">
          {open ? 'إخفاء' : 'مراجعة'}
        </span>
      </button>

      {open && (
        <ul className="mt-4 space-y-2.5">
          {[...high, ...medium].map((cl) => (
            <li key={cl.id} className="rounded-xl border border-token bg-white p-3.5">
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                    cl.severity === 'high' ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                  }`}
                  aria-label={cl.severity === 'high' ? 'يجب إصلاحها' : 'تحقّق'}
                />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{cl.location}</div>
                  <div className="mt-0.5 text-[13px] font-semibold text-foreground">{cl.claim}</div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted">{cl.why}</div>
                  <div className="mt-1.5 text-[12.5px] font-medium text-foreground">← {cl.fix}</div>
                </div>
              </div>
            </li>
          ))}
          <li className="px-1 pt-1 text-[11.5px] text-muted">
            تُرفَق هذه القائمة أيضًا داخل القالب كقائمة تحقّق في ملف README.md.
          </li>
        </ul>
      )}
    </div>
  )
}

function PublishPanel({
  productName, storeName, onGenerate, generating, onPublish,
}: {
  productName: string
  storeName: string
  onGenerate: () => void
  generating: boolean
  onPublish: (shop: string) => Promise<PublishResult>
}) {
  const [shop, setShop] = useState('')
  const [hasShopify, setHasShopify] = useState<'yes' | 'no' | null>(null)

  // Connect → publish state machine for the one-click path.
  const [connState, setConnState] = useState<'idle' | 'checking' | 'waiting' | 'connected'>('idle')
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [connError, setConnError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  const handle = shop
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.myshopify\.com$/, '')
    .replace(/[^a-z0-9-]/g, '')
  const shopDomain = handle ? `${handle}.myshopify.com` : ''

  const adminHref = handle ? `https://admin.shopify.com/store/${handle}/themes` : ''
  // Affiliate signup for users without a store.
  const shopifyAffiliate = 'https://www.shopify.com/free-trial?ref=zenya-ai'

  async function checkConnection(): Promise<boolean> {
    const r = await fetch(`/api/shopify/connection?shop=${encodeURIComponent(shopDomain)}`)
    const j = await r.json()
    return Boolean(j?.connected)
  }

  async function connect() {
    if (!shopDomain) return
    setConnError(null)
    setConnState('checking')
    try {
      if (await checkConnection()) {
        setConnState('connected')
        return
      }
      // Send the user through OAuth in a new tab, then poll until the
      // callback has bound the store to their account.
      window.open(
        `/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}&returnTo=${encodeURIComponent('/build/connected')}`,
        '_blank',
      )
      setConnState('waiting')
      for (let i = 0; i < 40; i++) {
        await new Promise((res) => setTimeout(res, 3000))
        try {
          if (await checkConnection()) {
            setConnState('connected')
            return
          }
        } catch { /* poll hiccup — keep waiting */ }
      }
      setConnState('idle')
      setConnError('لم نرَ الاتصال يكتمل. أكمِل موافقة Shopify ثم حاول مجددًا.')
    } catch (e: any) {
      setConnState('idle')
      setConnError(e?.message || 'فشل التحقق من الاتصال.')
    }
  }

  async function publish() {
    setPublishing(true)
    setPublishResult(null)
    const result = await onPublish(shopDomain)
    setPublishing(false)
    setPublishResult(result)
    if (result.status === 401 || result.status === 403) setConnState('idle')
  }

  return (
    <div className="space-y-4">
      {/* Generated banner */}
      <div className="rounded-2xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.06)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d] text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-foreground">
              قالب {productName || 'منتجك'} جاهز
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted">
              وصل ملف ‎.zip‎ للتو إلى مجلّد التنزيلات. ادفعه إلى Shopify بنقرتين أدناه.
            </p>
          </div>
        </div>
      </div>

      {/* Download / re-download */}
      <div className="rounded-2xl border border-token bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-bold text-foreground">ملف القالب ‎.zip‎</div>
            <div className="mt-0.5 text-[11.5px] text-muted">
              جاهز لـ Shopify · ارفعه من <em>المتجر الإلكتروني ← القوالب ← إضافة قالب</em>.
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition hover:bg-black/5 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            إعادة التنزيل
          </button>
        </div>
      </div>

      {/* Path picker */}
      {hasShopify === null && (
        <div className="rounded-2xl border border-token bg-white p-5">
          <div className="text-[14px] font-bold text-foreground">هل تملك متجر Shopify بعد؟</div>
          <div className="mt-0.5 text-[12px] text-muted">سنعرض لك الخطوة التالية المناسبة.</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHasShopify('yes')}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white transition hover:scale-[1.02]"
            >
              <Store className="h-4 w-4" /> نعم — لنرفعه
            </button>
            <button
              type="button"
              onClick={() => setHasShopify('no')}
              className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition hover:bg-black/5"
            >
              ليس بعد — أرني كيف أبدأ
            </button>
          </div>
        </div>
      )}

      {/* Has a Shopify store → connect once, then one-click publish */}
      {hasShopify === 'yes' && (
        <div className="rounded-2xl border border-token bg-white p-5">
          <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
            <Upload className="h-4 w-4 text-primary" /> انشر مباشرةً إلى متجر Shopify الخاص بك
          </div>
          <div className="mt-1 text-[12px] text-muted">
            اربط مرة واحدة وتُثبّت زينيا القالب <strong>وتنشئ المنتج</strong> من بيانات
            AliExpress المستخرجة — وتُربط أزرار الشراء به تلقائيًا.
          </div>

          <div className="mt-3 flex items-stretch gap-2">
            <div className="relative flex-1">
              <input
                dir="ltr"
                value={shop}
                onChange={(e) => { setShop(e.target.value); setConnState('idle'); setPublishResult(null) }}
                placeholder={storeName ? storeName.toLowerCase().replace(/[^a-z0-9-]+/g, '-') : 'my-store'}
                className="w-full rounded-lg border border-token bg-surface px-3 py-2.5 pr-32 text-[14px] text-foreground outline-none transition focus:border-primary"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                .myshopify.com
              </span>
            </div>
            {connState !== 'connected' && (
              <button
                type="button"
                disabled={!handle || connState === 'checking' || connState === 'waiting'}
                onClick={connect}
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold shadow-sm transition ' +
                  (handle ? 'bg-primary text-white hover:scale-[1.02] disabled:opacity-60' : 'cursor-not-allowed bg-primary/40 text-white')
                }
              >
                {connState === 'checking' || connState === 'waiting'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Store className="h-4 w-4" />}
                {connState === 'waiting' ? 'بانتظار Shopify…' : 'اتصال'}
              </button>
            )}
          </div>

          {connState === 'waiting' && (
            <div className="mt-2 text-[12px] text-muted">
              وافِق على تطبيق زينيا في التبويب الذي فُتح للتو — تلتقط هذه الشاشة الاتصال تلقائيًا.
            </div>
          )}
          {connError && (
            <div className="mt-2 rounded-lg border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12px] text-[#b91c1c]">
              {connError}
            </div>
          )}

          {connState === 'connected' && !publishResult?.ok && (
            <div className="mt-3 rounded-xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.05)] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Check className="h-4 w-4 text-[#15803d]" /> تم الاتصال بـ {shopDomain}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                نقرة واحدة تُثبّت القالب (غير منشور، آمن للمعاينة) وتنشئ
                «{productName || 'منتجك'}» بالصور والأسعار المستخرجة.
              </p>
              <button
                type="button"
                disabled={publishing}
                onClick={publish}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {publishing ? 'جارٍ نشر القالب + المنتج…' : 'انشر القالب + المنتج'}
              </button>
            </div>
          )}

          {publishResult && !publishResult.ok && (
            <div className="mt-3 rounded-lg border border-[rgba(220,38,38,0.20)] bg-[rgba(220,38,38,0.06)] px-3 py-2 text-[12.5px] text-[#b91c1c]">
              {publishResult.message || 'فشل النشر — حاول مجددًا.'}
            </div>
          )}

          {publishResult?.ok && publishResult.theme && (
            <div className="mt-3 rounded-xl border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.05)] p-4">
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-foreground">
                <Check className="h-4 w-4 text-[#15803d]" /> منشور على {shopDomain}
              </div>
              <p className="mt-1 text-[12px] text-muted">
                القالب <strong>{publishResult.theme.name}</strong> مُثبَّت (غير منشور)
                {publishResult.product ? ' وأُنشئ المنتج' : ''}.
                {publishResult.theme.processing ? ' يُنهي Shopify المعالجة — امنحه ~30 ثانية.' : ''}
                {publishResult.productError ? ` فشل إنشاء المنتج: ${publishResult.productError}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={publishResult.theme.previewUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white transition hover:scale-[1.02]">
                  معاينة المتجر <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a href={publishResult.theme.editorUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-black/5">
                  تخصيص القالب <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {publishResult.product && (
                  <a href={publishResult.product.adminUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-black/5">
                    عرض المنتج <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {publishResult.theme.themesUrl && (
                  <a href={publishResult.theme.themesUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-black/5">
                    انشره مباشرةً <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasShopify(null)}
              className="text-[11.5px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              → تغيير الإجابة
            </button>
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="text-[11.5px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              {showManual ? 'إخفاء الرفع اليدوي' : 'تفضّل رفع ملف zip يدويًا؟'}
            </button>
          </div>

          {showManual && (
            <ol className="mt-3 space-y-2 border-t border-token pt-3 text-[12.5px] text-foreground">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">1</span>
                <span>
                  افتح{' '}
                  <a className="font-semibold underline" href={adminHref || 'https://admin.shopify.com'} target="_blank" rel="noreferrer">
                    المتجر الإلكتروني ← القوالب
                  </a>{' '}
                  وانقر <strong>إضافة قالب ← رفع ملف zip</strong> بملف ‎.zip‎ الذي نزّلته.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">2</span>
                <span>انقر <strong>تخصيص</strong> — كل قسم قابل للتعديل من هناك.</span>
              </li>
            </ol>
          )}
        </div>
      )}

      {/* No Shopify store → affiliate signup */}
      {hasShopify === 'no' && (
        <div className="rounded-2xl border border-token bg-white p-5">
          <div className="text-[14px] font-bold text-foreground">ابدأ متجرك مجانًا لمدة 3 أيام</div>
          <div className="mt-1 text-[12.5px] text-muted">
            تمنحك تجربة Shopify المجانية متجرًا يعمل. وما إن يجهز، عُد والصق معرّف متجرك، وسننقلك مباشرةً إلى شاشة الرفع.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={shopifyAffiliate}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-[13px] font-semibold text-white transition hover:scale-[1.02]"
            >
              ابدأ تجربة Shopify المجانية <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setHasShopify('yes')}
              className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-4 py-2 text-[13px] font-semibold text-foreground transition hover:bg-black/5"
            >
              في الواقع أملك واحدًا — دعني ألصق معرّف متجري
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
