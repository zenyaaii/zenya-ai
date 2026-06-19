"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import StepProgress from '@/components/StepProgress'
import ImageSelector from '@/components/ImageSelector'
import ColorPicker from '@/components/ColorPicker';
import ColorThief from 'colorthief';
import ThemePreview from '@/components/ThemePreview';
import ProductPage from '@/components/theme/ProductPage';
import StoreNavbar from '@/components/theme/StoreNavbar';
import MobilePreview from '@/components/wizard/MobilePreview';
import ShopifyAffiliateCallout from '@/components/ShopifyAffiliateCallout';
import { themePreview } from '@/lib/theme-previews';

type StylePresetId = 'clean_light' | 'bold_gradient' | 'luxury_dark'
type WebsiteStyleId = 'one_product' | 'catalog_store' | 'brand_story'

const WEBSITE_STYLES: Array<{
  id: WebsiteStyleId
  name: string
  description: string
}> = [
  { id: 'one_product', name: 'منتج واحد', description: 'مسار يركّز على المنتج وعالي التحويل (الأفضل لمتاجر العرض الواحد).' },
  { id: 'catalog_store', name: 'متجر كتالوج', description: 'واجهة متجر متعددة المنتجات تركّز على تصفّح التشكيلات.' },
  { id: 'brand_story', name: 'قصة العلامة', description: 'صفحة رئيسية تقودها القصة مع الثقة والمجتمع وتدفّق المحتوى.' }
]

const STYLE_PRESETS: Array<{
  id: StylePresetId
  name: string
  description: string
  p: string
  s: string
  sectionStyles: Record<string, string>
}> = [
  {
    id: 'clean_light',
    name: 'فاتح أنيق',
    description: 'أسطح ناعمة فاخرة وإحساس عصري متوازن.',
    p: '#4f46e5',
    s: '#06b6d4',
    sectionStyles: {
      heroPanel: 'soft',
      marketing: 'soft',
      socialProof: 'soft',
      faq: 'soft',
      productMedia: 'soft',
      countdown: 'glass',
      volume: 'soft',
      upsellBundles: 'soft',
      frequentlyBought: 'soft',
      guaranteeBar: 'soft',
      stickyAtc: 'glass'
    }
  },
  {
    id: 'bold_gradient',
    name: 'تدرّج جريء',
    description: 'تباين أقوى وبطاقات زجاجية أغنى وأجواء نابضة.',
    p: '#7c3aed',
    s: '#06b6d4',
    sectionStyles: {
      heroPanel: 'glass',
      marketing: 'glass',
      socialProof: 'glass',
      faq: 'soft',
      productMedia: 'glass',
      countdown: 'glass',
      volume: 'glass',
      upsellBundles: 'glass',
      frequentlyBought: 'glass',
      guaranteeBar: 'soft',
      stickyAtc: 'glass'
    }
  },
  {
    id: 'luxury_dark',
    name: 'داكن فاخر',
    description: 'مظهر راقٍ بسيط بأسطح هادئة.',
    p: '#111827',
    s: '#334155',
    sectionStyles: {
      heroPanel: 'minimal',
      marketing: 'minimal',
      socialProof: 'minimal',
      faq: 'minimal',
      productMedia: 'minimal',
      countdown: 'minimal',
      volume: 'minimal',
      upsellBundles: 'minimal',
      frequentlyBought: 'minimal',
      guaranteeBar: 'minimal',
      stickyAtc: 'minimal'
    }
  }
]

export default function NewThemePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [businessType, setBusinessType] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [scrapedDescription, setScrapedDescription] = useState('')
  const [productFacts, setProductFacts] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('49.99')
  const [originalPrice, setOriginalPrice] = useState('99.99')
  const [shopName, setShopName] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [primary, setPrimary] = useState('#4f46e5')
  const [secondary, setSecondary] = useState('#06b6d4')
  const [stylePreset, setStylePreset] = useState<StylePresetId>('clean_light')
  const [websiteStyle, setWebsiteStyle] = useState<WebsiteStyleId>('one_product')
  const [content, setContent] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  
  const PALETTES = [
    { name: 'تقنية عصرية', p: '#4f46e5', s: '#06b6d4' },
    { name: 'طبيعة', p: '#059669', s: '#10b981' },
    { name: 'حيوية', p: '#dc2626', s: '#f87171' },
    { name: 'دفء', p: '#d97706', s: '#fbbf24' },
    { name: 'ثقة', p: '#2563eb', s: '#60a5fa' },
    { name: 'ملكي', p: '#7c3aed', s: '#a78bfa' },
    { name: 'مرِح', p: '#db2777', s: '#f472b6' },
    { name: 'بسيط', p: '#111827', s: '#6b7280' },
  ]

  function applyStylePreset(presetId: StylePresetId) {
    const preset = STYLE_PRESETS.find((x) => x.id === presetId)
    if (!preset) return
    setStylePreset(presetId)
    setPrimary(preset.p)
    setSecondary(preset.s)
    setContent((prev: any) =>
      prev
        ? {
            ...prev,
            stylePreset: preset.id,
            _preview: {
              ...(prev?._preview || {}),
              stylePreset: preset.id,
              sectionStyles: preset.sectionStyles
            }
          }
        : prev
    )
  }

  function applyWebsiteStyle(styleId: WebsiteStyleId) {
    setWebsiteStyle(styleId)
    setContent((prev: any) =>
      prev
        ? {
            ...prev,
            websiteStyle: styleId,
            _preview: {
              ...(prev?._preview || {}),
              websiteStyle: styleId
            }
          }
        : prev
    )
  }
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const t = params.get('type')
    if (t === 'restaurant') {
      router.replace('/theme/new/restaurant')
    } else if (t === 'services' || t === 'local-services' || t === 'local_service') {
      router.replace('/theme/new/services')
    } else if (t === 'wellness') {
      router.replace('/theme/new/wellness')
    } else if (t === 'atlas' || t === 'saas' || t === 'software') {
      router.replace('/theme/new/atlas')
    } else if (t === 'lookbook' || t === 'fashion' || t === 'apparel') {
      router.replace('/theme/new/lookbook')
    } else if (t === 'collective' || t === 'catalog' || t === 'multi-product') {
      router.replace('/theme/new/collective')
    } else if (t === 'studio' || t === 'brand-story' || t === 'editorial') {
      router.replace('/theme/new/studio')
    } else if (t === 'one_product' || t === 'one-product') {
      // The legacy one-product wizard is being replaced by the new
      // URL-driven dropshipping builder at /build. Bounce there so
      // anyone landing on the old link gets the new flow.
      router.replace('/build')
    }
  }, [router])

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_themes_limit, trial_themes_used')
        .eq('id', user.id)
        .maybeSingle()

      const isPro = !!profile?.is_pro
      const used = profile?.trial_themes_used ?? 0
      const limit = profile?.trial_themes_limit ?? 3

      if (!isPro && used >= limit) {
        alert(`لقد استخدمت كل عمليات التوليد المجانية الـ ${limit}. رقِّ إلى Pro للحصول على عدد غير محدود.`)
        router.push('/pricing')
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router, supabase])

  if (checkingAuth) {
    return <div className="flex min-h-screen items-center justify-center">جارٍ التحميل...</div>
  }

  if (!businessType) {
    return <BusinessTypePicker onPick={(t) => {
      if (t === 'restaurant') {
        router.push('/theme/new/restaurant')
      } else if (t === 'services') {
        router.push('/theme/new/services')
      } else if (t === 'wellness') {
        router.push('/theme/new/wellness')
      } else if (t === 'saas' || t === 'atlas') {
        router.push('/theme/new/atlas')
      } else if (t === 'lookbook' || t === 'fashion') {
        router.push('/theme/new/lookbook')
      } else if (t === 'collective' || t === 'catalog') {
        router.push('/theme/new/collective')
      } else if (t === 'studio' || t === 'brand-story') {
        router.push('/theme/new/studio')
      } else if (t === 'one_product') {
        router.push('/build')
      } else {
        alert('هذا النوع من الأعمال قادم قريبًا. سنراسلك عبر البريد عند إطلاقه.')
      }
    }} />
  }

  async function safeReadJson(response: Response) {
    const text = await response.text()
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 200)}`)
      }
    }
    throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`)
  }
  
  async function scrape() {
    setLoading(true)
    try {
      const r = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } })
      const j = await safeReadJson(r)
      if (!r.ok || j.error) throw new Error(j.message || j.error || 'فشل الاستخراج')
      setName(j.name)
      setScrapedDescription(j.description || '')
      setProductFacts(j.productFacts || null)
      setImages(j.images)
      setStep(2)
    } catch {
      alert('فشل استخراج البيانات. قد تكون صفحة المنتج تحجب الطلبات. جرّب رابطًا آخر أو استخدم مصدرًا مدعومًا.')
    } finally {
      setLoading(false)
    }
  }

  async function generateAndSave() {
    setLoading(true)
    try {
      // 1. Generate Content
      const r = await fetch('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: scrapedDescription,
          productUrl: url,
          price: Number.isFinite(parseFloat(price)) ? parseFloat(price) : undefined,
          originalPrice: Number.isFinite(parseFloat(originalPrice)) ? parseFloat(originalPrice) : undefined,
          productFacts: productFacts || undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const j = await safeReadJson(r)
      if (!r.ok || j.error) throw new Error(j.message || j.error || 'فشل توليد المحتوى')
      if (typeof j?._meta?.source === 'string' && j._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', j?._meta)
      }
      setContent(j)

      // 2. Save Theme
      const saveRes = await fetch('/api/themes', { 
        method: 'POST', 
        body: JSON.stringify({ 
          productUrl: url, 
          productName: name, 
          images: selectedImages, 
          primaryColor: primary, 
          secondaryColor: secondary, 
          content: {
            ...j,
            price: parseFloat(price) || 49.99,
            originalPrice: parseFloat(originalPrice) || 99.99,
            shopName: shopName || name,
            stylePreset,
            _preview: {
              ...(j?._preview || {}),
              stylePreset,
              sectionStyles: (STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0]).sectionStyles
            }
          },
          // Send raw product data for future import
          productData: {
            name: name,
            description: j.hero?.subheadline || 'AI Generated Product',
            images: selectedImages,
            price: parseFloat(price) || 49.99,
            originalPrice: parseFloat(originalPrice) || 99.99
          }
        }), 
        headers: { 'Content-Type': 'application/json' } 
      })
      
      const saveJson = await safeReadJson(saveRes)
      
      if (saveRes.status === 401) {
        alert('يرجى تسجيل الدخول لحفظ قالبك.')
        window.location.href = '/login'
        return
      }

      if (saveJson.id) {
        window.location.href = `/preview/${saveJson.id}`
      } else if (saveJson.error === 'limit_reached') {
        alert('لقد بلغت حدّ القوالب المجانية. يرجى الترقية للمتابعة.')
        // Optional: redirect to pricing
        // window.location.href = '/pricing'
      } else {
        alert('فشل حفظ القالب. يرجى المحاولة مجددًا.')
      }
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'فشل توليد القالب وحفظه.')
    } finally {
      setLoading(false)
    }
  }

  async function generateProductPreview() {
    if (!name) return
    setLoading(true)
    try {
      const r = await fetch('/api/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: scrapedDescription,
          productUrl: url,
          price: Number.isFinite(parseFloat(price)) ? parseFloat(price) : undefined,
          originalPrice: Number.isFinite(parseFloat(originalPrice)) ? parseFloat(originalPrice) : undefined,
          productFacts: productFacts || undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const j = await safeReadJson(r)
      if (!r.ok || j.error) throw new Error(j.message || j.error || 'فشل توليد المعاينة')
      if (typeof j?._meta?.source === 'string' && j._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', j?._meta)
      }
      const preset = STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0]
      setContent({
        ...j,
        stylePreset: preset.id,
        _preview: {
          ...(j?._preview || {}),
          stylePreset: preset.id,
          sectionStyles: preset.sectionStyles
        }
      })
      setStep(3)
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'فشل توليد معاينة المنتج.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">إنشاء قالب جديد</h1>
          <p className="mt-2 text-muted">انتقل من رابط المنتج إلى متجر منشور خلال دقائق.</p>
        </div>
        <StepProgress step={step} total={3} />
      </div>

      <ShopifyAffiliateCallout
        placement="theme_new_ecom_picker"
        variant="banner"
        className="mb-6"
      />

      <div className="rounded-2xl border border-token bg-elevated p-8 shadow-soft-md">
        {step === 1 && (
          <div className="mx-auto max-w-lg space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">🔗</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">ابدأ بمنتجك</h2>
              <p className="mt-2 text-muted">الصق رابط منتجك (AliExpress أو Amazon أو Shopify، إلخ).</p>
            </div>
            <div className="relative">
              <input
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-token bg-surface px-5 py-4 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              disabled={!url || loading}
              onClick={scrape}
              className="w-full rounded-full bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? 'جارٍ تحليل المنتج...' : 'ابدأ البناء'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="rounded-xl bg-green-500/10 p-4 flex items-center gap-3 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="text-xl">✅</span>
              <span className="font-medium">رائع! وجدنا تفاصيل منتجك.</span>
            </div>

            {/* Name Verification */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">اسم المنتج</label>
              <div className="flex gap-3">
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="أدخل اسم المنتج..."
                />
                <button
                  onClick={async () => {
                    const baseContext = scrapedDescription || name || "an ecommerce product";
                    setName("جارٍ التوليد...");
                    try {
                      const res = await fetch('/api/generate-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ context: baseContext.substring(0, 500) })
                      });
                      const data = await res.json();
                      setName(data.name || "منتج مميّز");
                    } catch (e) {
                      setName("");
                    }
                  }}
                  disabled={loading}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-bold text-white shadow-sm transition hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  <span>✨</span> تسمية تلقائية
                </button>
              </div>
              <p className="text-xs text-muted">عدّل الاسم ليبدو احترافيًا (مثلاً، احذف «2024 جديد» أو وسوم العلامات التجارية).</p>
            </div>

            {/* Price & Shop Name */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">السعر الأصلي ($)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="99.99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">سعر العرض ($)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="49.99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">اسم المتجر</label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="مثلاً: متجر زينيا"
                />
              </div>
            </div>

            {/* Image Selection */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">اختر الصور</h2>
                  <p className="text-sm text-muted">اختر أفضل الصور لمتجرك.</p>
                </div>
                <span className="text-sm font-medium bg-surface px-3 py-1 rounded-full border border-token">{selectedImages.length} محدّدة</span>
              </div>
              <ImageSelector images={images} selected={selectedImages} onChange={setSelectedImages} />
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(1)} className="rounded-full border border-token px-6 py-2.5 font-medium text-muted transition hover:bg-surface hover:text-foreground">رجوع</button>
              <div className="flex flex-col items-end gap-2">
                <button
                  disabled={selectedImages.length < 5 || !name.trim() || loading}
                  onClick={generateProductPreview}
                  className="rounded-full bg-primary px-8 py-2.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading ? 'جارٍ توليد معاينة المنتج...' : 'ولّد معاينة المنتج'}
                </button>
                {selectedImages.length < 5 && (
                  <span className="text-xs font-medium text-red-500">يرجى اختيار 5 صور على الأقل للمتابعة. ({selectedImages.length}/5)</span>
                )}
                {!name.trim() && selectedImages.length >= 5 && (
                  <span className="text-xs font-medium text-red-500">يرجى إدخال اسم المنتج للمتابعة.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Design Your Store */}
        {step === 3 && (
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">صمّم متجرك</h2>
              <p className="mt-2 text-lg text-muted">اختر لوحة ألوان للبدء واضبط ألوانك بدقّة.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column: Palettes & Custom */}
              <div className="space-y-8 lg:col-span-7">
                {/* Style Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">أنماط القالب الجاهزة</h3>
                    <span className="text-xs text-muted">اتجاه تصميمي كامل بنقرة واحدة</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {STYLE_PRESETS.map((preset) => {
                      const selected = stylePreset === preset.id
                      return (
                        <button
                          key={preset.id}
                          onClick={() => applyStylePreset(preset.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-primary ring-1 ring-primary bg-primary/5'
                              : 'border-token bg-surface hover:border-primary/30'
                          }`}
                        >
                          <div className="mb-2 flex h-8 w-full overflow-hidden rounded-md ring-1 ring-black/5">
                            <div className="h-full w-1/2" style={{ backgroundColor: preset.p }} />
                            <div className="h-full w-1/2" style={{ backgroundColor: preset.s }} />
                          </div>
                          <p className={`text-xs font-bold ${selected ? 'text-primary' : 'text-foreground'}`}>{preset.name}</p>
                          <p className="mt-1 text-[11px] text-muted">{preset.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Palette Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PALETTES.map((c) => {
                    const isSelected = primary === c.p && secondary === c.s
                    return (
                      <button 
                        key={c.name}
                        onClick={() => { setPrimary(c.p); setSecondary(c.s) }}
                        className={`group relative flex flex-col gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-95 ${
                          isSelected 
                            ? 'border-primary ring-1 ring-primary bg-primary/5' 
                            : 'border-token bg-surface hover:border-primary/30'
                        }`}
                      >
                        <div className="flex h-10 w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
                          <div className="h-full w-1/2" style={{ backgroundColor: c.p }} />
                          <div className="h-full w-1/2" style={{ backgroundColor: c.s }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {c.name}
                          </span>
                          {isSelected && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Colors */}
                <div className="rounded-2xl border border-token bg-surface/50 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-token text-xs">🎨</div>
                      <h3 className="font-bold text-foreground">ألوان مخصّصة</h3>
                    </div>
                    <button 
                      disabled={isExtracting}
                      onClick={async () => {
                        setIsExtracting(true);
                        try {
                          const imgUrl = selectedImages[0] || images[0];
                          if (!imgUrl) {
                             const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                             setPrimary(randomColor());
                             setSecondary(randomColor());
                             return;
                          }
                          
                          const img = new Image();
                          img.crossOrigin = 'Anonymous';
                          img.src = imgUrl;
                          
                          await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                          });

                          const colorThief = new ColorThief();
                          const palette = colorThief.getPalette(img, 5);
                          
                          const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(x => {
                            const hex = x.toString(16);
                            return hex.length === 1 ? '0' + hex : hex;
                          }).join('');

                          if (palette && palette.length >= 2) {
                            setPrimary(rgbToHex(palette[0][0], palette[0][1], palette[0][2]));
                            setSecondary(rgbToHex(palette[1][0], palette[1][1], palette[1][2]));
                          }
                        } catch (e) {
                          console.error(e);
                          const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                          setPrimary(randomColor());
                          setSecondary(randomColor());
                        } finally {
                          setIsExtracting(false);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <span className="animate-spin">⏳</span> جارٍ التحليل...
                        </>
                      ) : (
                        <>
                          مطابقة سحرية ✨
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Primary Color Input */}
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">اللون الأساسي</label>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10">
                          <input
                            type="color"
                            value={primary}
                            onChange={(e) => setPrimary(e.target.value)}
                            className="absolute -left-2 -top-2 h-20 w-24 cursor-pointer p-0 border-0"
                          />
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">#</span>
                          <input
                            type="text"
                            dir="ltr"
                            value={primary.replace('#', '')}
                            onChange={(e) => setPrimary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-token bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted">يُستخدَم للأزرار والروابط والإبرازات.</p>
                    </div>

                    {/* Secondary Color Input */}
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">لون التمييز</label>
                      <div className="flex items-center gap-3">
                         <div className="relative h-12 w-16 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10">
                          <input
                            type="color"
                            value={secondary}
                            onChange={(e) => setSecondary(e.target.value)}
                            className="absolute -left-2 -top-2 h-20 w-24 cursor-pointer p-0 border-0"
                          />
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">#</span>
                          <input
                            type="text"
                            dir="ltr"
                            value={secondary.replace('#', '')}
                            onChange={(e) => setSecondary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-token bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted">يُستخدَم لوسوم التخفيضات والتنبيهات والإجراءات الثانوية.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Preview */}
              <div className="lg:col-span-5">
                <MobilePreview 
                  name={name}
                  price={price}
                  originalPrice={originalPrice}
                  images={selectedImages}
                  primary={primary}
                  secondary={secondary}
                  content={content}
                  shopName={shopName}
                  iframeId="preview-frame-main"
                  mode="product"
                  lockToProduct
                />
              </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-token">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 rounded-full border border-token px-8 py-3 font-bold text-muted transition hover:bg-surface hover:text-foreground">
                <span>→</span> رجوع
              </button>
              <button
                onClick={generateAndSave}
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-white shadow-xl shadow-primary/20 transition hover:scale-105 hover:shadow-primary/30 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> جارٍ بناء المتجر...
                  </>
                ) : (
                  <>
                    ولّد وانشر <span>←</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

type BusinessTypeOption = {
  id: string
  name: string
  tagline: string
  description: string
  accent: string
  status: 'live' | 'coming-soon'
  cover: string
}

const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    id: 'restaurant',
    name: 'مطعم',
    tagline: 'مطاعم راقية · مقاهٍ',
    description: 'قائمة طعام وحجوزات ومواعيد ومعرض صور وقصة. قالب «دار» للمطاعم الراقية.',
    accent: '#c8a96a',
    status: 'live',
    cover: themePreview('restaurant')
  },
  {
    id: 'one_product',
    name: 'متجر منتج واحد',
    tagline: 'دروبشيبينغ · عرض واحد',
    description: 'مسار منتج واحد عالي التحويل مع الحزم وعناصر الإلحاح وكتل الثقة.',
    accent: '#6366f1',
    status: 'live',
    cover: themePreview('one_product')
  },
  {
    id: 'saas',
    name: 'برمجيات / SaaS',
    tagline: 'صفحة منتج · B2B',
    description: 'مزايا وباقات أسعار وتكاملات وزر طلب عرض توضيحي. قالب «أطلس» — مصمَّم لمنتجات SaaS الحديثة.',
    accent: '#6366f1',
    status: 'live',
    cover: themePreview('atlas')
  },
  {
    id: 'services',
    name: 'خدمات محلية',
    tagline: 'حِرَف · صالونات · وكالات',
    description: 'موقع خدمات محلية فاخر مع الخدمات والأدلّة وقبل/بعد ومناطق الخدمة والتقييمات ومسار طلب عرض السعر.',
    accent: '#f59e0b',
    status: 'live',
    cover: themePreview('services')
  },
  {
    id: 'collective',
    name: 'متجر كتالوج',
    tagline: 'متعدد المنتجات · تشكيلات',
    description: 'كتالوج فاخر بإضاءة شفقية مع تشكيلات منتقاة والأكثر مبيعًا والوافد الجديد وقصة العلامة والنشرة البريدية. قالب «نُخبة».',
    accent: '#10b981',
    status: 'live',
    cover: themePreview('collective')
  },
  {
    id: 'studio',
    name: 'قصة العلامة',
    tagline: 'تحريري · قصة المؤسّس',
    description: 'صفحة علامة تحريرية فاخرة بخطوط عرض ضخمة ورسالة المؤسّس وخط زمني وقيم وجدار صحافة وإحصاءات المجتمع. قالب «ستوديو».',
    accent: '#0a0a0a',
    status: 'live',
    cover: themePreview('studio')
  },
  {
    id: 'lookbook',
    name: 'أزياء محتشمة',
    tagline: 'لوك بوك · تحريري · علامة',
    description: 'لوك بوك تحريري بكامل العرض وشبكة الأكثر مبيعًا وقصة العلامة وجدار صحافة وتقييمات ونشرة بريدية.',
    accent: '#0a0a0a',
    status: 'live',
    cover: themePreview('lookbook')
  },
  {
    id: 'wellness',
    name: 'ستوديو عافية',
    tagline: 'سبا · يوغا · عافية',
    description: 'قائمة جلسات وملفات المختصّين ومعرض صور وشهادات ومسار حجز.',
    accent: '#14b8a6',
    status: 'live',
    cover: themePreview('wellness')
  }
]

function BusinessTypePicker({ onPick }: { onPick: (type: string) => void }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[640px] w-[640px] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[520px] w-[520px] translate-x-1/4 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[560px] w-[560px] -translate-x-1/3 translate-y-1/4 rounded-full bg-amber-300/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-2xl" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">الخطوة 1 من 2</p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            ما نوع نشاطك؟
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            اختر الأقرب لنشاطك. كل نوع عمل يستخدم تخطيطًا وبنية محتوى وموجّه ذكاء اصطناعي مختلفًا.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_TYPES.map((t) => {
            const live = t.status === 'live'
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t.id)}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-token bg-surface/60 text-left shadow-soft-md backdrop-blur-xl transition ${
                  live ? 'cursor-pointer hover:-translate-y-1 hover:shadow-soft-lg' : 'opacity-80 cursor-pointer'
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={t.cover}
                    alt={t.name}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${!live ? 'grayscale-[30%]' : ''}`}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' }} />
                  <div className="absolute left-0 top-0 h-1 w-full" style={{ background: t.accent }} />
                  <div className="absolute end-3 top-3">
                    {live ? (
                      <span className="rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-black" style={{ background: t.accent }}>
                        متاح
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur">
                        قريبًا
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-white/80">{t.tagline}</p>
                    <h2 className="mt-0.5 text-2xl font-extrabold">{t.name}</h2>
                  </div>
                </div>
                <div className="flex-1 p-5">
                  <p className="text-sm text-muted">{t.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
