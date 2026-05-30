'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TitleBar } from '@shopify/app-bridge-react';
import StepProgress from '@/components/StepProgress';
import ImageSelector from '@/components/ImageSelector';
import ColorThief from 'colorthief';
import MobilePreview from '@/components/wizard/MobilePreview';
import { generateShopifyTheme } from '@/utils/shopify-generator';
import { saveAs } from 'file-saver';

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

function NewThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');

  const [step, setStep] = useState(1);
  
  const [url, setUrl] = useState('');
  const [scrapedDescription, setScrapedDescription] = useState('');
  const [productFacts, setProductFacts] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('49.99');
  const [originalPrice, setOriginalPrice] = useState('99.99');
  const [shopName, setShopName] = useState(shop?.replace('.myshopify.com', '') || '');
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [primary, setPrimary] = useState('#4f46e5');
  const [secondary, setSecondary] = useState('#06b6d4');
  const [stylePreset, setStylePreset] = useState<StylePresetId>('clean_light');
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);

  const PALETTES = [
    { name: 'Modern Tech', p: '#4f46e5', s: '#06b6d4' },
    { name: 'Nature', p: '#059669', s: '#10b981' },
    { name: 'Energetic', p: '#dc2626', s: '#f87171' },
    { name: 'Warmth', p: '#d97706', s: '#fbbf24' },
    { name: 'Trust', p: '#2563eb', s: '#60a5fa' },
    { name: 'Royal', p: '#7c3aed', s: '#a78bfa' },
    { name: 'Playful', p: '#db2777', s: '#f472b6' },
    { name: 'Minimal', p: '#111827', s: '#6b7280' },
  ];

  function applyStylePreset(presetId: StylePresetId) {
    const preset = STYLE_PRESETS.find((x) => x.id === presetId);
    if (!preset) return;
    setStylePreset(presetId);
    setPrimary(preset.p);
    setSecondary(preset.s);
    setContent((prev: any) =>
      prev
        ? {
            ...prev,
            stylePreset: preset.id,
            _preview: { ...(prev?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
          }
        : prev
    );
  }

  async function safeReadJson(response: Response) {
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 200)}`);
      }
    }
    throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }
  
  async function scrape() {
    setLoading(true);
    setDownloadedFileName(null);
    try {
      const r = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } });
      const j = await safeReadJson(r);
      if (!r.ok || j.error) throw new Error(j.message || j.error || 'Failed to scrape');
      setName(j.name);
      setScrapedDescription(j.description || '');
      setProductFacts(j.productFacts || null);
      setImages(j.images);
      setStep(2);
    } catch {
      alert('Failed to scrape. Try another URL.');
    } finally {
      setLoading(false);
    }
  }

  async function generateAndDownload() {
    setLoading(true);
    setDownloadedFileName(null);
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
      });
      const j = await safeReadJson(r);
      if (!r.ok || j?.error) throw new Error(j.message || j.error || 'Failed to generate content')
      if (typeof j?._meta?.source === 'string' && j._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', j?._meta)
      }
      const preset = STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0];
      const payload = {
        ...j,
        stylePreset: preset.id,
        _preview: { ...(j?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
      };
      setContent(payload);

      const blob = await generateShopifyTheme(
        name,
        { ...payload, shopName: shopName || name },
        { primary, secondary },
        selectedImages
      );
      const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`;
      saveAs(blob, fileName);
      setDownloadedFileName(fileName);
      
    } catch (e: any) {
      console.error(e);
      alert('Error generating and downloading theme: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateProductPreview() {
    if (!name) return
    setLoading(true);
    setDownloadedFileName(null);
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
      });
      const j = await safeReadJson(r);
      if (!r.ok || j?.error) throw new Error(j.message || j.error || 'Failed to generate product preview');
      if (typeof j?._meta?.source === 'string' && j._meta.source.startsWith('fallback')) {
        console.warn('AI generation returned fallback content', j?._meta)
      }
      const preset = STYLE_PRESETS.find((x) => x.id === stylePreset) || STYLE_PRESETS[0];
      setContent({
        ...j,
        stylePreset: preset.id,
        _preview: { ...(j?._preview || {}), stylePreset: preset.id, sectionStyles: preset.sectionStyles }
      });
      setStep(3);
    } catch (e: any) {
      console.error(e);
      alert('Error generating product preview: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TitleBar title="Create New Theme" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">New Theme Generator</h1>
            <button 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
          <StepProgress step={step} total={3} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Input URL */}
        {step === 1 && (
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl mb-6">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Start with a Product</h2>
            <p className="text-gray-500 mb-6 text-center">Enter an AliExpress or Amazon product URL to extract details.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.aliexpress.com/item/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>
              <button 
                onClick={scrape}
                disabled={!url || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {loading ? 'Analyzing...' : 'Analyze Product'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Product Details & Images */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
               <div className="rounded-xl bg-green-50 p-4 flex items-center gap-3 text-green-700 border border-green-100 mb-6">
                <span className="text-xl">✅</span>
                <span className="font-medium">Success! We found your product details.</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-6">
                 <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">Product Name</label>
                  <div className="flex gap-3">
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70"
                    >
                      <span>✨</span> Auto-Name
                    </button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">Store Name</label>
                  <input 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Sale Price</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Original Price</label>
                  <input 
                    type="number" 
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Product Images</h2>
              <ImageSelector 
                images={images} 
                selected={selectedImages} 
                onChange={setSelectedImages} 
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Back</button>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={generateProductPreview}
                  disabled={selectedImages.length < 5 || !name.trim() || loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                  {loading ? 'Generating Product Preview...' : 'Generate Product Preview'}
                </button>
                {selectedImages.length < 5 && (
                  <span className="text-xs font-medium text-red-500">Please select at least 5 images. ({selectedImages.length}/5)</span>
                )}
                {!name.trim() && selectedImages.length >= 5 && (
                  <span className="text-xs font-medium text-red-500">Please provide a product name.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Design Your Store */}
        {step === 3 && (
          <div className="max-w-5xl mx-auto">
            {downloadedFileName && (
              <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <span className="font-medium">Downloaded: {downloadedFileName}</span>
                </div>
              </div>
            )}
             <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Design Your Store</h2>
              <p className="mt-2 text-lg text-gray-500">Choose a starting palette and fine-tune your colors.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Left Column: Palettes & Custom */}
              <div className="space-y-8 lg:col-span-7">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Theme Style Presets</h3>
                    <span className="text-xs text-gray-500">One click full style</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {STYLE_PRESETS.map((preset) => {
                      const selected = stylePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => applyStylePreset(preset.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${selected ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                        >
                          <div className="mb-2 flex h-8 w-full overflow-hidden rounded-md ring-1 ring-black/5">
                            <div className="h-full w-1/2" style={{ backgroundColor: preset.p }} />
                            <div className="h-full w-1/2" style={{ backgroundColor: preset.s }} />
                          </div>
                          <p className={`text-xs font-bold ${selected ? 'text-indigo-600' : 'text-gray-900'}`}>{preset.name}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{preset.description}</p>
                        </button>
                      );
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
                            ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50' 
                            : 'border-gray-200 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex h-10 w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
                          <div className="h-full w-1/2" style={{ backgroundColor: c.p }} />
                          <div className="h-full w-1/2" style={{ backgroundColor: c.s }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                            {c.name}
                          </span>
                          {isSelected && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
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
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs">🎨</div>
                      <h3 className="font-bold text-gray-900">Custom Colors</h3>
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
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50"
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
                    {/* Primary Color Input */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Primary Color</label>
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
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">#</span>
                          <input 
                            type="text" 
                            value={primary.replace('#', '')} 
                            onChange={(e) => setPrimary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Used for buttons, links, and highlights.</p>
                    </div>

                    {/* Secondary Color Input */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Accent Color</label>
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
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">#</span>
                          <input 
                            type="text" 
                            value={secondary.replace('#', '')} 
                            onChange={(e) => setSecondary(`#${e.target.value.replace('#', '')}`)}
                            className="w-full pl-7 pr-3 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                            maxLength={6}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Used for sales tags, alerts, and secondary actions.</p>
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
                  mode="product"
                  lockToProduct
                />
              </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-200 mt-12">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700">
                <span>←</span> Back
              </button>
              <button 
                onClick={generateAndDownload} 
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:scale-105 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Generating Theme...
                  </>
                ) : (
                  <>
                    Download Theme Zip <span>⬇️</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}



      </div>
    </div>
  );
}

export default function NewThemePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewThemeContent />
    </Suspense>
  );
}
