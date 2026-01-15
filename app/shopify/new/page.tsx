'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TitleBar } from '@shopify/app-bridge-react';
import StepProgress from '@/components/StepProgress';
import ImageSelector from '@/components/ImageSelector';
import ColorPicker from '@/components/ColorPicker';
import ThemePreview from '@/components/ThemePreview';

function NewThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');

  const [step, setStep] = useState(1);
  
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('49.99');
  const [originalPrice, setOriginalPrice] = useState('99.99');
  const [shopName, setShopName] = useState(shop?.replace('.myshopify.com', '') || '');
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [primary, setPrimary] = useState('#4f46e5');
  const [secondary, setSecondary] = useState('#06b6d4');
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  async function scrape() {
    setLoading(true);
    try {
      const r = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setName(j.name);
      setImages(j.images);
      setStep(2);
    } catch {
      alert('Failed to scrape. Try another URL.');
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch('/api/generate-content', { method: 'POST', body: JSON.stringify({ name }), headers: { 'Content-Type': 'application/json' } });
      const j = await r.json();
      setContent(j);
      setStep(4);
    } catch {
      alert('Failed to generate content.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const themeData = {
        productUrl: url,
        productName: name,
        images: selectedImages,
        primaryColor: primary,
        secondaryColor: secondary,
        content: {
          ...content,
          price: parseFloat(price) || 49.99,
          originalPrice: parseFloat(originalPrice) || 99.99,
          shopName: shopName || name
        }
      };

      const r = await fetch('/api/shopify/themes', { 
        method: 'POST', 
        body: JSON.stringify({ 
          shop, 
          themeData 
        }), 
        headers: { 'Content-Type': 'application/json' } 
      });
      
      const j = await r.json();
      
      if (!r.ok) {
        throw new Error(j.error || 'Failed to save');
      }

      alert(`Theme installed successfully! Theme ID: ${j.themeId}`);
      router.push(`/shopify?host=${host}&shop=${shop}`);
      
    } catch (e: any) {
      console.error(e);
      alert('Error saving theme: ' + e.message);
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
          <StepProgress step={step} total={4} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Input URL */}
        {step === 1 && (
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start with a Product</h2>
            <p className="text-gray-500 mb-6">Enter an AliExpress or Amazon product URL to extract details.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.aliexpress.com/item/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button 
                onClick={scrape}
                disabled={!url || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                {loading ? 'Analyzing...' : 'Analyze Product'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Images */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Product Images</h2>
              <ImageSelector 
                images={images} 
                selected={selectedImages} 
                onChange={setSelectedImages} 
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Back</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={selectedImages.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customize Style */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Brand Style</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                  <input 
                    type="number" 
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <ColorPicker 
                label="Primary Brand Color" 
                value={primary} 
                onChange={setPrimary} 
              />
              
              <ColorPicker 
                label="Secondary / Accent Color" 
                value={secondary} 
                onChange={setSecondary} 
              />

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Back</button>
                <button 
                  onClick={generate} 
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  ) : null}
                  Generate Theme
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Save */}
        {step === 4 && content && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Theme Preview</h3>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="h-[600px] overflow-y-auto bg-gray-100">
                <ThemePreview 
                  name={name}
                  images={selectedImages}
                  primaryColor={primary}
                  secondaryColor={secondary}
                  content={content}
                  price={parseFloat(price) || 49.99}
                  originalPrice={parseFloat(originalPrice) || 99.99}
                  shopName={shopName || name}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pb-12">
              <button onClick={() => setStep(3)} className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 bg-white">Back to Editing</button>
              <button 
                onClick={save}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg transform hover:-translate-y-0.5 transition flex items-center"
              >
                 {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : null}
                Install Theme to Shopify
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
