"use client"
import { useEffect, useState } from 'react'
import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'
import Link from 'next/link'
import { generateShopifyTheme } from '@/utils/shopify-generator'
import { saveAs } from 'file-saver'

export default function DraftPreviewPage() {
  const [theme, setTheme] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Load draft from localStorage
    const draft = localStorage.getItem('zenya_draft_theme')
    if (draft) {
      setTheme(JSON.parse(draft))
    }
  }, [])

  const handleDownload = async () => {
    if (!theme) return
    setIsGenerating(true)
    try {
      const blob = await generateShopifyTheme(theme.productName, theme.content, { primary: theme.primaryColor, secondary: theme.secondaryColor })
      saveAs(blob, `${theme.productName.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`)
    } catch (e) {
      console.error(e)
      alert('Failed to generate theme')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!theme) return <div className="flex h-screen items-center justify-center text-muted">Loading draft...</div>

  return (
    <main className="min-h-screen pb-24 md:pb-10 bg-white">
      {/* Simulation Bar */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex gap-2">
               <div className="h-3 w-3 rounded-full bg-red-400"></div>
               <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
               <div className="h-3 w-3 rounded-full bg-green-400"></div>
             </div>
             <div className="hidden rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-500 md:block">
               {theme.shopName || theme.productName || 'My Store'} - Live Preview
             </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
               Draft Mode
             </span>
             <button 
               onClick={handleDownload}
               disabled={isGenerating}
               className="rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
             >
               {isGenerating ? 'Generating...' : 'Download Test Theme'}
             </button>
             <button 
               onClick={() => window.close()}
               className="text-xs font-bold text-gray-500 hover:text-gray-900"
             >
               Close Preview
             </button>
          </div>
        </div>
      </div>

      <div className="mx-auto">
        <ThemePreview 
          name={theme.productName} 
          images={theme.images || []} 
          primaryColor={theme.primaryColor} 
          secondaryColor={theme.secondaryColor} 
          content={theme.content} 
          price={theme.price}
          originalPrice={theme.originalPrice}
          shopName={theme.shopName}
        />
      </div>
    </main>
  )
}
