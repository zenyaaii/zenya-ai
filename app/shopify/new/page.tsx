'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TitleBar } from '@shopify/app-bridge-react';
import { createClient } from '@/utils/supabase/client';
import ComingSoon from '@/components/build/ComingSoon';
import ImageSelector from '@/components/ImageSelector';
import { saveAs } from 'file-saver';
import { useShopifyBridge } from '@/components/ShopifyAppBridge';
import { PALETTES, VIBE_LABELS, getPalette, type Palette } from '@/lib/build/palettes';
import { collectClaims, type ThemeClaim } from '@/lib/build/seed';
import type { BuildConfig } from '@/lib/build/theme-generator';

type ScrapedReview = { name: string; country?: string; rating: number; text: string; photos?: string[]; date?: string };
type Scraped = {
  name: string;
  description: string;
  images: string[];
  price?: number | null;
  originalPrice?: number | null;
  productFacts?: { highlights?: string[]; specs?: Record<string, string> } | null;
  reviews?: ScrapedReview[];
  reviewStats?: { average: number; count: number } | null;
};

const MIN_IMAGES = 5;
const STEP_LABELS = ['المنتج', 'التفاصيل', 'المظهر', 'التثبيت'];

function NewThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';
  const { authenticatedFetch } = useShopifyBridge();
  const supabase = useMemo(() => createClient(), []);

  // Admin-only gate while the new one-product builder is in the works. We
  // FAIL OPEN when no Supabase session is readable (e.g. the embedded iframe
  // can't see it) so the admin is never locked out; a positively-identified
  // non-admin sees the coming-soon screen.
  const [gate, setGate] = useState<'loading' | 'ok' | 'soon'>('loading');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive) return;
        if (!user) { setGate('ok'); return; }
        const { data: prof } = await supabase
          .from('profiles').select('plan').eq('id', user.id).maybeSingle();
        if (!alive) return;
        setGate(prof?.plan === 'admin' ? 'ok' : 'soon');
      } catch {
        if (alive) setGate('ok');
      }
    })();
    return () => { alive = false; };
  }, [supabase]);

  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [scraped, setScraped] = useState<Scraped | null>(null);
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState(shop.replace('.myshopify.com', ''));
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [paletteId, setPaletteId] = useState(PALETTES[0].id);

  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honestyOpen, setHonestyOpen] = useState(false);
  const [honestyAcked, setHonestyAcked] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const palette = useMemo(() => getPalette(paletteId), [paletteId]);
  const realReviewCount = (scraped?.reviews || []).filter((r) => r.text && r.text.length >= 8).length;

  async function scrape() {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) { setError('أضف http:// أو https:// إلى الرابط.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) { setError(j?.message || 'تعذّرت قراءة تلك الصفحة. جرّب رابط منتج آخر.'); return; }
      const s: Scraped = {
        name: j.name || '', description: j.description || '',
        images: Array.isArray(j.images) ? j.images : [],
        price: typeof j.price === 'number' ? j.price : null,
        originalPrice: typeof j.originalPrice === 'number' ? j.originalPrice : null,
        productFacts: j.productFacts || null,
        reviews: Array.isArray(j.reviews) ? j.reviews : [],
        reviewStats: j.reviewStats || null,
      };
      setScraped(s);
      setName(s.name);
      setPrice(s.price != null ? String(s.price) : '');
      setOriginalPrice(s.originalPrice != null ? String(s.originalPrice) : '');
      setSelectedImages(s.images.slice(0, MIN_IMAGES));
      setStep(2);
    } catch (e: any) {
      setError(e?.message || 'خطأ في الشبكة.');
    } finally { setLoading(false); }
  }

  async function generateNameAI() {
    const baseContext = scraped?.description || name || 'منتج تجارة إلكترونية';
    setNameLoading(true);
    try {
      const res = await fetch('/api/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: baseContext.substring(0, 500) }),
      });
      const data = await res.json();
      if (data?.name) setName(data.name);
    } catch { /* silent — keep the current name */ }
    finally { setNameLoading(false); }
  }

  function buildPayload() {
    return {
      productName: name,
      storeName,
      salePrice: Number(price) || 0,
      originalPrice: Number(originalPrice) || 0,
      images: selectedImages,
      paletteId,
      description: scraped?.description || '',
      highlights: scraped?.productFacts?.highlights || [],
      specs: scraped?.productFacts?.specs || {},
      sourceUrl: url,
      reviews: scraped?.reviews || [],
      reviewStats: scraped?.reviewStats || null,
    };
  }

  async function ackThenColors() {
    if (honestyAcked) { setStep(3); return; }
    setHonestyOpen(true);
  }

  async function recordAck(claimIds: string[]) {
    try {
      await fetch('/api/build/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: name, storeName, sourceUrl: url, claimIds }),
      });
    } catch { /* best-effort in the iframe */ }
    setHonestyAcked(true);
    setHonestyOpen(false);
    setStep(3);
  }

  async function installToStore() {
    setPublishing(true); setError(null); setResult(null);
    try {
      const r = await authenticatedFetch('/api/build/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) { setError(j?.message || 'فشل التثبيت. يُرجى المحاولة مرة أخرى.'); return; }
      setResult(j);
    } catch (e: any) {
      setError(e?.message || 'خطأ في الشبكة أثناء التثبيت.');
    } finally { setPublishing(false); }
  }

  async function downloadZip() {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/build/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!r.ok) { setError('تعذّر إنشاء ملف القالب المضغوط.'); return; }
      const blob = await r.blob();
      saveAs(blob, `${(storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-zenya-theme.zip`);
    } catch (e: any) {
      setError(e?.message || 'فشل التنزيل.');
    } finally { setLoading(false); }
  }

  const canColors = selectedImages.length >= MIN_IMAGES && name.trim() && storeName.trim() && Number(price) > 0;
  const heroImage = selectedImages[0] || scraped?.images?.[0] || '';

  if (gate === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7FB]">
        <TitleBar title="إنشاء قالب جديد" />
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (gate === 'soon') {
    const qs = searchParams.toString();
    return (
      <div className="relative min-h-screen bg-[#F7F7FB] pb-24">
        <TitleBar title="قريبًا" />
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <ComingSoon
            browseHref="https://zenyaai.co/themes"
            browseTarget="_blank"
            onBack={() => router.push(`/shopify${qs ? `?${qs}` : ''}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F7F7FB] pb-24">
      <TitleBar title="إنشاء قالب جديد" />
      {/* Ambient wash — subtle indigo/purple background that matches Zenya's website */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-200/30 via-pink-100/20 to-transparent blur-3xl" />
      </div>

      {/* Header + step indicator */}
      <div className="sticky top-0 z-10 border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">متجر منتج واحد جديد</h1>
              <p className="mt-0.5 text-xs text-gray-500">من رابط منتج إلى متجر جاهز في أربع خطوات.</p>
            </div>
            <div className="hidden text-xs font-medium text-gray-500 sm:block">
              الخطوة <span className="font-bold text-indigo-600">{step}</span> من {STEP_LABELS.length}
            </div>
          </div>
          <StepStrip step={step} />
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1 — URL ─────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="mx-auto max-w-xl"
            >
              <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white p-10 shadow-[0_20px_60px_-20px_rgba(99,102,241,0.25)]">
                {/* Subtle top gradient accent */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <LinkIcon />
                </div>
                <h2 className="text-center text-2xl font-extrabold tracking-tight text-gray-900">ابدأ بمنتج</h2>
                <p className="mx-auto mt-2 max-w-sm text-center text-sm text-gray-500">
                  الصق رابط منتج من AliExpress — نسحب الصور والسعر والمواصفات والمراجعات الحقيقية.
                </p>
                <div className="mt-6">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.aliexpress.com/item/..."
                    dir="ltr"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5 text-start text-sm text-gray-900 shadow-inner transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  onClick={scrape}
                  disabled={!url || loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] hover:shadow-indigo-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      جارٍ التحليل…
                    </>
                  ) : (
                    <>تحليل المنتج<ArrowRight /></>
                  )}
                </button>

                <ul className="mt-6 grid grid-cols-3 gap-3 text-[11px] font-medium text-gray-500">
                  <li className="flex items-center gap-1.5"><Check /> مراجعات حقيقية</li>
                  <li className="flex items-center gap-1.5"><Check /> صور عالية الجودة</li>
                  <li className="flex items-center gap-1.5"><Check /> بدون تسجيل</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* ── Step 2 — details + images ────────────────────────────── */}
          {step === 2 && scraped && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-gray-200/70 bg-white p-7 shadow-[0_20px_60px_-24px_rgba(99,102,241,0.2)]">
                {realReviewCount >= 3 && (
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">✓</span>
                    تم استيراد {realReviewCount} مراجعة حقيقية
                    {scraped.reviewStats && ` · ${scraped.reviewStats.average.toFixed(1)}★ من ${scraped.reviewStats.count.toLocaleString()} تقييم`}
                  </div>
                )}

                {/* Product name — with AI generator */}
                <div className="mb-6">
                  <label className="mb-1.5 block text-sm font-bold text-gray-900">اسم المنتج</label>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسم المنتج…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-900 shadow-inner transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={generateNameAI}
                      disabled={nameLoading}
                      title="ولّد اسمًا احترافيًا بالذكاء الاصطناعي"
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                    >
                      {nameLoading ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <SparklesIcon />
                      )}
                      <span className="hidden sm:inline">اسم بالذكاء الاصطناعي</span>
                      <span className="sm:hidden">اقتراح</span>
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-500">اضغط «اسم بالذكاء الاصطناعي» لاقتراح اسم عربي احترافي بناءً على وصف المنتج.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <FieldInput label="اسم المتجر" value={storeName} onChange={setStoreName} />
                  <FieldInput label="سعر البيع" value={price} onChange={setPrice} type="number" dir="ltr" />
                  <FieldInput label="السعر قبل الخصم" value={originalPrice} onChange={setOriginalPrice} type="number" dir="ltr" />
                </div>

                <div className="mt-7">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-gray-900">اختر صور المنتج</h3>
                    <span className={`text-xs font-semibold ${selectedImages.length >= MIN_IMAGES ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {selectedImages.length}/{MIN_IMAGES}+ صور
                    </span>
                  </div>
                  <ImageSelector images={scraped.images} selected={selectedImages} onChange={setSelectedImages} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">رجوع</button>
                <button
                  onClick={ackThenColors}
                  disabled={!canColors}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  اختيار الألوان<ArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3 — palette + live mobile preview ───────────────── */}
          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">اختر مظهر متجرك</h2>
                <p className="mt-1 text-sm text-gray-500">كل لوحة ألوان نظام متكامل مضبوط للتحويل — شاهد كيف سيبدو متجرك فورًا.</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-12">
                {/* Palette grid */}
                <div className="lg:col-span-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PALETTES.map((p) => {
                      const selected = paletteId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPaletteId(p.id)}
                          className={`group relative overflow-hidden rounded-2xl border p-4 text-right transition-all ${
                            selected
                              ? 'border-indigo-600 shadow-[0_10px_30px_-8px_rgba(99,102,241,0.4)] ring-2 ring-indigo-600/40'
                              : 'border-gray-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md'
                          }`}
                          style={{ background: p.bg, color: p.fg }}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {[p.surface, p.primary, p.accent].map((c, i) => (
                                <span key={i} className="h-6 w-6 rounded-full ring-2 ring-black/5" style={{ background: c }} />
                              ))}
                            </div>
                            {selected && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-600 shadow ring-1 ring-black/10">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-bold">{p.name}</div>
                          <div className="mt-0.5 text-[11px] opacity-70">{VIBE_LABELS[p.vibe].name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live mobile preview */}
                <div className="lg:col-span-5">
                  <div className="sticky top-32">
                    <PalettePhonePreview
                      palette={palette}
                      productName={name || 'اسم المنتج'}
                      storeName={storeName || 'متجرك'}
                      price={price}
                      originalPrice={originalPrice}
                      image={heroImage}
                      reviewStats={scraped?.reviewStats || null}
                    />
                    <p className="mt-3 text-center text-[11px] text-gray-500">معاينة تقريبية لصفحة المنتج بالألوان المختارة.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button onClick={() => setStep(2)} className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">رجوع</button>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02]"
                >
                  مراجعة وتثبيت<ArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4 — install ─────────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {!result && (
                <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white p-10 text-center shadow-[0_20px_60px_-20px_rgba(99,102,241,0.25)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white shadow-lg shadow-indigo-500/30">🚀</div>
                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900">التثبيت في {shop || 'متجرك'}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    نقرة واحدة تثبّت القالب الكامل (غير منشور، آمن للمعاينة) <strong>و</strong> تُنشئ
                    «{name}» ضمن منتجاتك — وتُربط أزرار الشراء به تلقائيًا.
                  </p>
                  <button
                    onClick={installToStore}
                    disabled={publishing}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {publishing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        جارٍ تثبيت القالب + المنتج…
                      </>
                    ) : 'تثبيت القالب + المنتج'}
                  </button>
                  <div className="mt-5">
                    <button onClick={downloadZip} disabled={loading} className="text-xs font-medium text-gray-500 underline transition hover:text-indigo-600 disabled:opacity-50">
                      {loading ? 'جارٍ التحضير…' : 'أو نزّل ملف ‎.zip بدلًا من ذلك'}
                    </button>
                  </div>
                </div>
              )}

              {result?.ok && result.needsManualInstall && (
                <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-7 shadow-lg">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    </span>
                    <h2 className="text-lg font-extrabold text-gray-900">تثبيت يدوي — خطوة إضافية بسيطة</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    Shopify يشترط موافقة مسبقة على تطبيقات تثبيت القوالب تلقائيًا — طلب موافقتنا قيد المراجعة حاليًا.
                    {result.product ? ' في الأثناء، أنشأنا المنتج في متجرك،' : ' في الأثناء،'}
                    ونزّل ملف القالب واتّبع الخطوات أدناه لرفعه (أقل من دقيقة):
                  </p>

                  <button
                    onClick={downloadZip}
                    disabled={loading}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        جارٍ التحضير…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        تنزيل ملف القالب (.zip)
                      </>
                    )}
                  </button>

                  <ol className="mt-6 space-y-2.5 rounded-xl bg-white/80 p-4 text-sm text-gray-700 ring-1 ring-amber-200">
                    <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">١</span> نزّل ملف <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">.zip</code> بالضغط على الزر أعلاه.</li>
                    <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">٢</span> افتح <strong>Online Store → Themes</strong> في لوحة تحكم متجرك.</li>
                    <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">٣</span> اضغط <strong>Add theme → Upload zip file</strong>، ثم اختر الملف الذي نزّلته.</li>
                    <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">٤</span> بعد الانتهاء، اضغط <strong>Preview</strong> للاطلاع، أو <strong>Publish</strong> لتفعيله مباشرة على المتجر.</li>
                  </ol>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {result.themesUrl && <a href={result.themesUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800">فتح صفحة القوالب</a>}
                    {result.product?.adminUrl && <a href={result.product.adminUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">عرض المنتج</a>}
                  </div>

                  {result.productError && (
                    <p className="mt-3 text-xs text-amber-700">ملاحظة عن المنتج: {result.productError}</p>
                  )}

                  <button onClick={() => router.push(`/shopify?host=${searchParams.get('host')}&shop=${shop}`)} className="mt-4 text-xs font-medium text-gray-500 underline hover:text-indigo-600">→ العودة إلى لوحة التحكم</button>
                </div>
              )}

              {result?.ok && !result.needsManualInstall && (
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-lg">
                  <h2 className="text-lg font-extrabold text-gray-900">✅ تم التثبيت في {result.shop}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    تمت إضافة القالب <strong>{result.theme?.name}</strong> (غير منشور){result.product ? ' وتم إنشاء المنتج' : ''}.
                    {result.theme?.processing ? ' تنهي Shopify المعالجة — امهلها نحو ٣٠ ثانية.' : ''}
                    {result.productError ? ` ملاحظة عن المنتج: ${result.productError}` : ''}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.theme?.editorUrl && <a href={result.theme.editorUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:scale-105">تخصيص القالب</a>}
                    {result.theme?.previewUrl && <a href={result.theme.previewUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">معاينة المتجر</a>}
                    {result.product?.adminUrl && <a href={result.product.adminUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">عرض المنتج</a>}
                    {result.theme?.themesUrl && <a href={result.theme.themesUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">نشره مباشرةً</a>}
                  </div>
                  <button onClick={() => router.push(`/shopify?host=${searchParams.get('host')}&shop=${shop}`)} className="mt-4 text-xs font-medium text-gray-500 underline hover:text-indigo-600">→ العودة إلى لوحة التحكم</button>
                </div>
              )}

              {!result && (
                <div className="flex justify-start">
                  <button onClick={() => setStep(3)} className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">رجوع</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {honestyOpen && (
        <HonestyModal
          reviews={scraped?.reviews || []}
          reviewStats={scraped?.reviewStats || null}
          specs={scraped?.productFacts?.specs || null}
          onClose={() => setHonestyOpen(false)}
          onAck={recordAck}
        />
      )}
    </div>
  );
}

// ── Small building blocks ─────────────────────────────────────────────

function StepStrip({ step }: { step: number }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                done
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : active
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/40 ring-4 ring-indigo-500/15'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? '✓' : idx}
            </div>
            <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
            {idx < STEP_LABELS.length && (
              <div className={`h-[2px] flex-1 rounded-full transition-all ${done ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({
  label, value, onChange, type = 'text', dir,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-gray-900">{label}</span>
      <input
        value={value}
        type={type}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-900 shadow-inner transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
    </label>
  );
}

// ── Live phone preview for the palette step ────────────────────────────
// Small self-contained mockup rendered with the palette's CSS variables so
// the user sees how the product page will look for each palette — no iframe,
// no build step, instant re-render on selection.

function PalettePhonePreview({
  palette, productName, storeName, price, originalPrice, image, reviewStats,
}: {
  palette: Palette;
  productName: string;
  storeName: string;
  price: string;
  originalPrice: string;
  image: string;
  reviewStats: { average: number; count: number } | null;
}) {
  const priceNum = Number(price) || 0;
  const origNum = Number(originalPrice) || 0;
  const hasDiscount = origNum > priceNum && priceNum > 0;
  const discount = hasDiscount ? Math.round(((origNum - priceNum) / origNum) * 100) : 0;

  return (
    <div
      className="mx-auto w-[320px] overflow-hidden rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl ring-1 ring-black/5"
      style={{ background: palette.bg }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-2 text-[9px] font-bold" style={{ color: palette.fg, background: palette.surface }}>
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>••••</span>
          <span>◨</span>
        </div>
      </div>

      {/* Store header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ background: palette.surface, borderBottom: `1px solid ${palette.border}` }}>
        <div className="text-[13px] font-extrabold tracking-tight" style={{ color: palette.fg }}>{storeName}</div>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: palette.muted }}>
          <span>☰</span>
          <span>🛒</span>
        </div>
      </div>

      {/* Product image */}
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: palette.surface }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl opacity-40" style={{ color: palette.muted }}>📦</div>
        )}
        {hasDiscount && (
          <div
            className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-md"
            style={{ background: palette.accent, color: palette.fg }}
          >
            وفّر {discount}%
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="px-5 pb-5 pt-4" style={{ background: palette.bg }}>
        {reviewStats && (
          <div className="mb-1.5 flex items-center gap-1 text-[10px]" style={{ color: palette.muted }}>
            <span style={{ color: palette.accent }}>★★★★★</span>
            <span>{reviewStats.average.toFixed(1)} ({reviewStats.count.toLocaleString()})</span>
          </div>
        )}
        <div className="text-[15px] font-extrabold leading-tight" style={{ color: palette.fg }}>{productName}</div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[18px] font-extrabold" style={{ color: palette.fg }}>${priceNum.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-[11px] line-through" style={{ color: palette.muted }}>${origNum.toFixed(2)}</span>
          )}
        </div>

        <button
          className="mt-3 w-full rounded-xl py-2.5 text-[12px] font-extrabold shadow-md transition"
          style={{ background: palette.primary, color: palette.primaryFg }}
        >
          أضف إلى السلة
        </button>
        <button
          className="mt-2 w-full rounded-xl border py-2 text-[11px] font-bold"
          style={{ borderColor: palette.border, color: palette.fg, background: palette.surface }}
        >
          اشترِ الآن
        </button>

        {/* Trust bar */}
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-[9px] font-semibold" style={{ borderColor: palette.border, color: palette.muted }}>
          <div className="flex items-center gap-1"><span style={{ color: palette.primary }}>✓</span> شحن مجاني</div>
          <div className="flex items-center gap-1"><span style={{ color: palette.primary }}>✓</span> إرجاع ٣٠ يوم</div>
          <div className="flex items-center gap-1"><span style={{ color: palette.primary }}>✓</span> ضمان</div>
        </div>
      </div>
    </div>
  );
}

// ── Tiny inline icons — no runtime dependency, keep bundle small ───────

function LinkIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="rtl-flip">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7L12 3z" />
      <path d="M18 15l.8 1.8L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-1.2L18 15z" />
    </svg>
  );
}

// ── Honesty modal (unchanged — visual polish only) ─────────────────────

function HonestyModal({
  reviews, reviewStats, specs, onClose, onAck,
}: {
  reviews: ScrapedReview[];
  reviewStats: { average: number; count: number } | null;
  specs: Record<string, string> | null;
  onClose: () => void;
  onAck: (ids: string[]) => void;
}) {
  const claims: ThemeClaim[] = useMemo(
    () => collectClaims({ reviews, reviewStats: reviewStats || undefined, specs: specs || undefined } as unknown as BuildConfig),
    [reviews, reviewStats, specs],
  );
  const high = claims.filter((c) => c.severity === 'high');
  const medium = claims.filter((c) => c.severity === 'medium');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">تنبيه — بعض أجزاء هذا القالب من اختراع الذكاء الاصطناعي</h2>
          <p className="mt-0.5 text-xs text-gray-600">{high.length} يجب إصلاحها · {medium.length} للتحقّق منها. أنت وحدك من يجعلها صحيحة قبل الإطلاق.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="space-y-2.5">
            {[...high, ...medium].map((cl) => (
              <li key={cl.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{cl.location}</div>
                <div className="mt-0.5 text-sm font-semibold text-gray-900">{cl.claim}</div>
                <div className="mt-1 text-xs text-gray-500">{cl.why}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            بالمتابعة فإنك تُقرّ بأن أعداد المخزون، وإشعارات المشترين، واقتباسات الصحافة، ونصوص المراجعات النائبة،
            وما شابهها هي أمثلة مولّدة بالذكاء الاصطناعي — وليست معلومات حقيقية — وأنه تقع على عاتقك مسؤولية استبدالها أو
            التحقّق منها قبل النشر.
          </p>
          <div className="flex items-center justify-between gap-3">
            <button onClick={onClose} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">رجوع</button>
            <button onClick={() => onAck(claims.map((c) => c.id))} className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:scale-[1.02]">أفهم — متابعة</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function NewThemePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">جارٍ التحميل…</div>}>
      <NewThemeContent />
    </Suspense>
  );
}
