'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StepProgress from '@/components/StepProgress'
import ImageSelector from '@/components/ImageSelector'
import ColorThief from 'colorthief'
import MobilePreview from '@/components/wizard/MobilePreview'
import { generateShopifyTheme } from '@/utils/shopify-generator'
import { saveAs } from 'file-saver'

type StylePresetId = 'clean_light' | 'bold_gradient' | 'luxury_dark'

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
    name: 'Clean Light',
    description: 'Soft premium',
    p: '#4f46e5',
    s: '#06b6d4',
    sectionStyles: { heroPanel: 'soft', marketing: 'soft', socialProof: 'soft', faq: 'soft', productMedia: 'soft', countdown: 'glass', volume: 'soft', upsellBundles: 'soft', frequentlyBought: 'soft', guaranteeBar: 'soft', stickyAtc: 'glass' }
  },
  {
    id: 'bold_gradient',
    name: 'Bold Gradient',
    description: 'Vivid glass',
    p: '#7c3aed',
    s: '#06b6d4',
    sectionStyles: { heroPanel: 'glass', marketing: 'glass', socialProof: 'glass', faq: 'soft', productMedia: 'glass', countdown: 'glass', volume: 'glass', upsellBundles: 'glass', frequentlyBought: 'glass', guaranteeBar: 'soft', stickyAtc: 'glass' }
  },
  {
    id: 'luxury_dark',
    name: 'Luxury Dark',
    description: 'Minimal luxe',
    p: '#111827',
    s: '#334155',
    sectionStyles: { heroPanel: 'minimal', marketing: 'minimal', socialProof: 'minimal', faq: 'minimal', productMedia: 'minimal', countdown: 'minimal', volume: 'minimal', upsellBundles: 'minimal', frequentlyBought: 'minimal', guaranteeBar: 'minimal', stickyAtc: 'minimal' }
  }
]

function CreateWizardContent() {
  const searchParams = useSearchParams()
  const host = searchParams.get('host')
  const shopParam = searchParams.get('shop')

  const shopDomain = useMemo(() => {
    if (shopParam) return shopParam
    if (host) {
      try {
        const decoded = atob(host)
        const match = decoded.match(/store\/([\w-]+)/)
        if (match?.[1]) return `${match[1]}.myshopify.com`
      } catch {}
    }
    return null
  }, [host, shopParam])

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (host) qs.set('host', host)
    if (shopParam) qs.set('shop', shopParam)
    return qs.toString()
  }, [host, shopParam])

  const [step, setStep] = useState(1)
  const [url, setUrl] = useState('')
  const [scrapedDescription, setScrapedDescription] = useState('')
  const [productFacts, setProductFacts] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('49.99')
  const [originalPrice, setOriginalPrice] = useState('99.99')
  const [shopName, setShopName] = useState(shopDomain?.replace('.myshopify.com', '') || '')
  const [images, setImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [primary, setPrimary] = useState('#4f46e5')
  const [secondary, setSecondary] = useState('#06b6d4')
  const [stylePreset, setStylePreset] = useState<StylePresetId>('clean_light')
  const [content, setContent] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null)

  useEffect(() => {
    setShopName(shopDomain?.replace('.myshopify.com', '') || '')
  }, [shopDomain])

  const PALETTES = [
    { name: 'Modern Tech', p: '#4f46e5', s: '#06b6d4' },
    { name: 'Nature', p: '#059669', s: '#10b981' },
    { name: 'Energetic', p: '#dc2626', s: '#f87171' },
    { name: 'Warmth', p: '#d97706', s: '#fbbf24' },
    { name: 'Trust', p: '#2563eb', s: '#60a5fa' },
    { name: 'Royal', p: '#7c3aed', s: '#a78bfa' },
    { name: 'Playful', p: '#db2777', s: '#f472b6' },
    { name: 'Minimal', p: '#111827', s: '#6b7280' },
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
            _preview: { ...(prev?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
          }
        : prev
    )
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
    setDownloadedFileName(null)
    try {
      const r = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } })
      const j = await safeReadJson(r)
      if (!r.ok || j.error) throw new Error(j.message || j.error || 'Failed to scrape')
      setName(j.name)
      setScrapedDescription(j.description || '')
      setProductFacts(j.productFacts || null)
      setImages(j.images || [])
      setSelectedImages([])
      if (j.price) setPrice(String(j.price))
      if (j.originalPrice) setOriginalPrice(String(j.originalPrice))
      setStep(2)
    } catch (e: any) {
      alert(e?.message || 'Failed to scrape. Try another URL.')
    } finally {
      setLoading(false)
    }
  }

  async function generateAndDownload() {
    if (!name) return
    setLoading(true)
    setDownloadedFileName(null)
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
      const generated = await safeReadJson(r)
      if (!r.ok || generated.error) throw new Error(generated.message || generated.error || 'Failed to generate content')
      if (typeof generated?._meta?.source === 'string' && generated._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', generated?._meta)
      }
      const preset = STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0]
      const payload = {
        ...generated,
        stylePreset: preset.id,
        _preview: { ...(generated?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
      }
      setContent(payload)

      const blob = await generateShopifyTheme(
        name,
        { ...payload, shopName: shopName || name },
        { primary, secondary },
        selectedImages
      )
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`
      saveAs(blob, fileName)
      setDownloadedFileName(fileName)
    } catch (e: any) {
      alert(e?.message || 'Error generating and downloading theme.')
    } finally {
      setLoading(false)
    }
  }

  async function generateProductPreview() {
    if (!name) return
    setLoading(true)
    setDownloadedFileName(null)
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
      const generated = await safeReadJson(r)
      if (!r.ok || generated.error) throw new Error(generated.message || generated.error || 'Failed to generate product preview')
      if (typeof generated?._meta?.source === 'string' && generated._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', generated?._meta)
      }
      const preset = STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0]
      setContent({
        ...generated,
        stylePreset: preset.id,
        _preview: { ...(generated?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
      })
      setStep(3)
    } catch (e: any) {
      alert(e?.message || 'Failed to generate product preview.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create New Theme</h1>
          <p className="mt-2 text-muted">Go from product link to a downloadable theme zip in minutes.</p>
        </div>
        <StepProgress step={step} total={3} />
      </div>

      <div className="rounded-2xl border border-token bg-elevated p-8 shadow-soft-md">
        {step === 1 && (
          <div className="mx-auto max-w-lg space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">🔗</div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Start with your product</h2>
              <p className="mt-2 text-muted">Paste the URL of your product (AliExpress, Amazon, Shopify, etc).</p>
            </div>
            <div className="relative">
              <input
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
              {loading ? 'Analyzing Product...' : 'Start Building'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl bg-green-500/10 p-4 flex items-center gap-3 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="text-xl">✅</span>
              <span className="font-medium">Success! We found your product details.</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Product Name</label>
              <div className="flex gap-3">
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter product name..."
                />
                <button
                  onClick={async () => {
                    const baseContext = scrapedDescription || name || "an ecommerce product";
                    setName("Generating...");
                    try {
                      const res = await fetch('/api/generate-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ context: baseContext.substring(0, 500) })
                      });
                      const data = await res.json();
                      setName(data.name || "Premium Product");
                    } catch (e) {
                      setName("");
                    }
                  }}
                  disabled={loading}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-bold text-white shadow-sm transition hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  <span>✨</span> Auto-Name
                </button>
              </div>
              <p className="text-xs text-muted">Edit the name to make it look professional (e.g., remove &quot;2024 New&quot; or brand tags).</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Original Price ($)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="99.99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Sale Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="49.99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Store Name</label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Zenya Store"
                />
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Select Images</h2>
                  <p className="text-sm text-muted">Choose the best photos for your store.</p>
                </div>
                <span className="text-sm font-medium bg-surface px-3 py-1 rounded-full border border-token">{selectedImages.length} selected</span>
              </div>
              <ImageSelector images={images} selected={selectedImages} onChange={setSelectedImages} />
            </div>

            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(1)} className="rounded-full border border-token px-6 py-2.5 font-medium text-muted transition hover:bg-surface hover:text-foreground">Back</button>
              <div className="flex flex-col items-end gap-2">
                <button
                  disabled={selectedImages.length < 5 || !name.trim() || loading}
                  onClick={generateProductPreview}
                  className="rounded-full bg-primary px-8 py-2.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading ? 'Generating Product Preview...' : 'Generate Product Preview'}
                </button>
                {selectedImages.length < 5 && (
                  <span className="text-xs font-medium text-red-500">Please select at least 5 images to proceed. ({selectedImages.length}/5)</span>
                )}
                {!name.trim() && selectedImages.length >= 5 && (
                  <span className="text-xs font-medium text-red-500">Please provide a product name to proceed.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">Design Your Store</h2>
              <p className="mt-2 text-lg text-muted">Choose a starting palette and fine-tune your colors.</p>
            </div>

            {downloadedFileName && (
              <div className="rounded-xl bg-green-500/10 p-4 flex items-center justify-between gap-3 text-green-600 dark:text-green-400 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <span className="font-medium">Downloaded: {downloadedFileName}</span>
                </div>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">Theme Style Presets</h3>
                    <span className="text-xs text-muted">One click full style</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {STYLE_PRESETS.map((preset) => {
                      const selected = stylePreset === preset.id
                      return (
                        <button
                          key={preset.id}
                          onClick={() => applyStylePreset(preset.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${selected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-token bg-surface hover:border-primary/30'}`}
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

                <div className="rounded-2xl border border-token bg-surface/50 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-token text-xs">🎨</div>
                      <h3 className="font-bold text-foreground">Custom Colors</h3>
                    </div>
                    <button
                      disabled={isExtracting}
                      onClick={async () => {
                        setIsExtracting(true);
                        try {
                          const imgUrl = selectedImages[0] || images[0];
                          if (!imgUrl) return;

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
                        } catch {
                        } finally {
                          setIsExtracting(false);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <span className="animate-spin">⏳</span> Analyzing...
                        </>
                      ) : (
                        <>
                          Magic Match ✨
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Primary Color</label>
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
                            value={primary.replace('#', '')}
                            onChange={(e) => setPrimary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-token bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted">Used for buttons, links, and highlights.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Accent Color</label>
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
                            value={secondary.replace('#', '')}
                            onChange={(e) => setSecondary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-token bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted">Used for sales tags, alerts, and secondary actions.</p>
                    </div>
                  </div>
                </div>
              </div>

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
                <span>←</span> Back
              </button>
              <button
                onClick={generateAndDownload}
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-primary px-10 py-3 font-bold text-white shadow-xl shadow-primary/20 transition hover:scale-105 hover:shadow-primary/30 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Generating Theme...
                  </>
                ) : (
                  <>
                    Download Theme Zip <span>→</span>
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

export default function CreateThemeWizard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CreateWizardContent />
    </Suspense>
  )
}
