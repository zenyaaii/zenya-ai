'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TitleBar } from '@shopify/app-bridge-react';
import ImageSelector from '@/components/ImageSelector';
import { saveAs } from 'file-saver';
import { useShopifyBridge } from '@/components/ShopifyAppBridge';
import { PALETTES, VIBE_LABELS, getPalette } from '@/lib/build/palettes';
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

function NewThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') || '';
  const { authenticatedFetch } = useShopifyBridge();

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
  const [error, setError] = useState<string | null>(null);
  const [honestyOpen, setHonestyOpen] = useState(false);
  const [honestyAcked, setHonestyAcked] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const palette = useMemo(() => getPalette(paletteId), [paletteId]);
  const realReviewCount = (scraped?.reviews || []).filter((r) => r.text && r.text.length >= 8).length;

  async function scrape() {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) { setError('Add http:// or https:// to the URL.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) { setError(j?.message || 'Could not read that page. Try another product URL.'); return; }
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
      setError(e?.message || 'Network error.');
    } finally { setLoading(false); }
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
      if (!r.ok || !j?.ok) { setError(j?.message || 'Install failed. Please try again.'); return; }
      setResult(j);
    } catch (e: any) {
      setError(e?.message || 'Network error during install.');
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
      if (!r.ok) { setError('Could not generate the theme zip.'); return; }
      const blob = await r.blob();
      saveAs(blob, `${(storeName || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-zenya-theme.zip`);
    } catch (e: any) {
      setError(e?.message || 'Download failed.');
    } finally { setLoading(false); }
  }

  const canColors = selectedImages.length >= MIN_IMAGES && name.trim() && storeName.trim() && Number(price) > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TitleBar title="Create New Theme" />
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold text-gray-900">New one-product store</h1>
          <div className="text-xs text-gray-500">Step {step} of 4</div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Step 1 — URL */}
        {step === 1 && (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">🔗</div>
            <h2 className="text-center text-xl font-bold text-gray-900">Start with a product</h2>
            <p className="mt-1 text-center text-sm text-gray-500">Paste an AliExpress product link — we pull images, price, specs, and real reviews.</p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/..."
              className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={scrape}
              disabled={!url || loading}
              className="mt-3 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze product'}
            </button>
          </div>
        )}

        {/* Step 2 — details + images */}
        {step === 2 && scraped && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {realReviewCount >= 3 && (
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ {realReviewCount} real reviews imported{scraped.reviewStats ? ` · ${scraped.reviewStats.average.toFixed(1)}★ from ${scraped.reviewStats.count.toLocaleString()} ratings` : ''}
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-900">Product name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-900">Store name</span>
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-900">Sale price</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-gray-900">Compare-at price</span>
                  <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
              </div>
              <h3 className="mb-3 mt-6 text-lg font-bold text-gray-900">Select product images ({selectedImages.length}/{MIN_IMAGES}+)</h3>
              <ImageSelector images={scraped.images} selected={selectedImages} onChange={setSelectedImages} />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50">Back</button>
              <button onClick={ackThenColors} disabled={!canColors} className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                Pick colors
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — palette */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose your store look</h2>
              <p className="mt-1 text-gray-500">Each palette is a complete, conversion-tuned color system.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PALETTES.map((p) => {
                const selected = paletteId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPaletteId(p.id)}
                    className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-indigo-300'}`}
                    style={{ background: p.bg, color: p.fg }}
                  >
                    <div className="mb-3 flex gap-1.5">
                      {[p.primary, p.accent, p.surface].map((c, i) => (
                        <span key={i} className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-xs opacity-70">{VIBE_LABELS[p.vibe].name}</div>
                    {selected && <div className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: p.primary, color: p.primaryFg }}>SELECTED</div>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-6">
              <button onClick={() => setStep(2)} className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(4)} className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white hover:bg-indigo-700">Review &amp; install</button>
            </div>
          </div>
        )}

        {/* Step 4 — install */}
        {step === 4 && (
          <div className="space-y-6">
            {!result && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">🚀</div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">Install into {shop || 'your store'}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  One click installs the full theme (unpublished, safe to preview) <strong>and</strong> creates
                  “{name}” in your products — the buy buttons attach to it automatically.
                </p>
                <button
                  onClick={installToStore}
                  disabled={publishing}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {publishing ? 'Installing theme + product…' : 'Install theme + product'}
                </button>
                <div className="mt-4">
                  <button onClick={downloadZip} disabled={loading} className="text-xs font-medium text-gray-500 underline hover:text-gray-700 disabled:opacity-50">
                    {loading ? 'Preparing…' : 'or download the .zip instead'}
                  </button>
                </div>
              </div>
            )}

            {result?.ok && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                <h2 className="text-lg font-bold text-gray-900">✅ Installed into {result.shop}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Theme <strong>{result.theme?.name}</strong> added (unpublished){result.product ? ' and the product was created' : ''}.
                  {result.theme?.processing ? ' Shopify is finishing processing — give it ~30s.' : ''}
                  {result.productError ? ` Product note: ${result.productError}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.theme?.editorUrl && <a href={result.theme.editorUrl} target="_blank" rel="noreferrer" className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">Customize theme</a>}
                  {result.theme?.previewUrl && <a href={result.theme.previewUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Preview store</a>}
                  {result.product?.adminUrl && <a href={result.product.adminUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">View product</a>}
                  {result.theme?.themesUrl && <a href={result.theme.themesUrl} target="_blank" rel="noreferrer" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Publish it live</a>}
                </div>
                <button onClick={() => router.push(`/shopify?host=${searchParams.get('host')}&shop=${shop}`)} className="mt-4 text-xs font-medium text-gray-500 underline hover:text-gray-700">← Back to dashboard</button>
              </div>
            )}

            {!result && (
              <div className="flex justify-start">
                <button onClick={() => setStep(3)} className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-50">Back</button>
              </div>
            )}
          </div>
        )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Heads up — parts of this theme are AI-invented</h2>
          <p className="mt-0.5 text-xs text-gray-600">{high.length} must-fix · {medium.length} to verify. Only you can make these true before launch.</p>
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
            By continuing you acknowledge that stock counts, buyer notifications, press quotes, review placeholders, and
            similar content are AI-generated examples — not real information — and it's your responsibility to replace or
            verify them before publishing.
          </p>
          <div className="flex items-center justify-between gap-3">
            <button onClick={onClose} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Go back</button>
            <button onClick={() => onAck(claims.map((c) => c.id))} className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">I understand — continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewThemePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <NewThemeContent />
    </Suspense>
  );
}
