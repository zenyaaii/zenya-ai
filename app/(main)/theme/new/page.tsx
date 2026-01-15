"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import StepProgress from '@/components/StepProgress'
import ImageSelector from '@/components/ImageSelector'
import ColorPicker from '@/components/ColorPicker'
import ThemePreview from '@/components/ThemePreview'

export default function NewThemePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('49.99')
  const [originalPrice, setOriginalPrice] = useState('99.99')
  const [shopName, setShopName] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [primary, setPrimary] = useState('#4f46e5')
  const [secondary, setSecondary] = useState('#06b6d4')
  const [content, setContent] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?mode=signup&next=/theme/new')
        return
      }

      // Check limits
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle()
        
      const isPro = !!sub

      if (!isPro) {
        const { count } = await supabase.from('themes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        if ((count || 0) >= 3) {
          alert('You have reached your free theme limit (3 themes). Please upgrade to continue.')
          router.push('/pricing')
        }
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router, supabase])

  if (checkingAuth) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }
  
  async function scrape() {
    setLoading(true)
    try {
      const r = await fetch('/api/scrape', { method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' } })
      const j = await r.json()
      if (j.error) throw new Error(j.error)
      setName(j.name)
      setImages(j.images)
      setStep(2)
    } catch {
      alert('Failed to scrape. Try another URL.')
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    setLoading(true)
    try {
      const r = await fetch('/api/generate-content', { method: 'POST', body: JSON.stringify({ name }), headers: { 'Content-Type': 'application/json' } })
      const j = await r.json()
      setContent(j)
      setStep(4)
    } catch {
      alert('Failed to generate content.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setLoading(true)
    try {
      const r = await fetch('/api/themes', { 
        method: 'POST', 
        body: JSON.stringify({ 
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
        }), 
        headers: { 'Content-Type': 'application/json' } 
      })
      
      const j = await r.json()
      
      if (r.status === 401) {
        alert('Please log in to save your theme.')
        window.location.href = '/login'
        return
      }

      if (j.id) {
        window.location.href = `/preview/${j.id}`
      } else if (j.error === 'limit_reached') {
        alert('You have reached your free theme limit. Please upgrade to continue.')
        // Optional: redirect to pricing
        // window.location.href = '/pricing'
      } else {
        alert('Failed to save theme. Please try again.')
      }
    } catch {
      alert('Error saving theme.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create New Theme</h1>
          <p className="mt-2 text-muted">Go from product link to published store in minutes.</p>
        </div>
        <StepProgress step={step} total={5} />
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
            {/* Success Banner */}
            <div className="rounded-xl bg-green-500/10 p-4 flex items-center gap-3 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="text-xl">✅</span>
              <span className="font-medium">Success! We found your product details.</span>
            </div>

            {/* Name Verification */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Product Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-token bg-surface px-5 py-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter product name..."
              />
              <p className="text-xs text-muted">Edit the name to make it look professional (e.g., remove &quot;2024 New&quot; or brand tags).</p>
            </div>

            {/* Price & Shop Name */}
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

            {/* Image Selection */}
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
              <button disabled={selectedImages.length === 0 || !name} onClick={() => setStep(3)} className="rounded-full bg-primary px-8 py-2.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 disabled:opacity-70">Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Define Your Brand</h2>
              <p className="mt-2 text-muted">Choose colors that match your product vibe.</p>
            </div>
            
            {/* Quick Color Suggestions */}
            <div className="flex justify-center gap-3">
              {[
                { p: '#4f46e5', s: '#06b6d4' }, // Indigo/Cyan
                { p: '#059669', s: '#10b981' }, // Emerald
                { p: '#dc2626', s: '#f87171' }, // Red
                { p: '#d97706', s: '#fbbf24' }, // Amber
                { p: '#2563eb', s: '#60a5fa' }, // Blue
                { p: '#7c3aed', s: '#a78bfa' }, // Violet
                { p: '#db2777', s: '#f472b6' }, // Pink
                { p: '#111827', s: '#6b7280' }, // Black/Gray
              ].map((c) => (
                <button 
                  key={c.p}
                  onClick={() => { setPrimary(c.p); setSecondary(c.s) }}
                  className="h-8 w-8 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${c.p} 50%, ${c.s} 50%)` }}
                  title="Apply this palette"
                />
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <ColorPicker value={primary} onChange={setPrimary} label="Primary Color" />
              <ColorPicker value={secondary} onChange={setSecondary} label="Secondary Color" />
            </div>
            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(2)} className="rounded-full border border-token px-6 py-2.5 font-medium text-muted transition hover:bg-surface hover:text-foreground">Back</button>
              <button onClick={generate} className="rounded-full bg-primary px-8 py-2.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 disabled:opacity-70">{loading ? 'Generating AI Content...' : 'Generate Theme'}</button>
            </div>
          </div>
        )}

        {step === 4 && content && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Preview & Customize</h2>
                <p className="text-sm text-muted">Review your store before saving.</p>
              </div>
              <button 
                onClick={() => {
                  const draft = {
                    productName: name,
                    images: selectedImages.length ? selectedImages : images.slice(0,4),
                    primaryColor: primary,
                    secondaryColor: secondary,
                    content,
                    price: parseFloat(price) || 49.99,
                    originalPrice: parseFloat(originalPrice) || 99.99,
                    shopName: shopName || name
                  }
                  localStorage.setItem('zenya_draft_theme', JSON.stringify(draft))
                  window.open('/preview/draft', '_blank')
                }}
                className="flex items-center gap-2 rounded-full bg-surface border border-token px-4 py-2 text-sm font-bold text-foreground hover:bg-gray-50 transition"
              >
                <span>↗️</span> Open Live Preview
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-token relative group">
              {/* Overlay hint */}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100 pointer-events-none">
                <span className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg">Click &apos;Open Live Preview&apos; for full experience</span>
              </div>
              <div className="opacity-50 pointer-events-none grayscale-[0.5] h-[500px] overflow-hidden">
                <ThemePreview 
                  name={name} 
                  images={selectedImages.length ? selectedImages : images.slice(0,4)} 
                  primaryColor={primary} 
                  secondaryColor={secondary} 
                  content={content}
                  price={parseFloat(price) || 49.99}
                  originalPrice={parseFloat(originalPrice) || 99.99}
                  shopName={shopName}
                />
              </div>
            </div>
            <div className="flex justify-between pt-6">
              <button onClick={() => setStep(3)} className="rounded-full border border-token px-6 py-2.5 font-medium text-muted transition hover:bg-surface hover:text-foreground">Back</button>
              <button onClick={() => setStep(5)} className="rounded-full bg-primary px-8 py-2.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105">Looks Good!</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">🚀</div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Ready to Launch?</h2>
              <p className="mt-2 text-muted">We&apos;ll save this theme to your dashboard.</p>
            </div>
            <button onClick={save} className="w-full rounded-full bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] disabled:opacity-70">
              {loading ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
