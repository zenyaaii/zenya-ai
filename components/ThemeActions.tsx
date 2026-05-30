"use client"
import { useState } from 'react'
import Link from 'next/link'
import { generateShopifyTheme } from '@/utils/shopify-generator'
import { saveAs } from 'file-saver'

type ThemeActionsProps = {
  themeId: string
  isPro: boolean
  content?: any
  colors?: { primary: string; secondary: string }
  name?: string
  images?: string[]
  price?: number
  originalPrice?: number
  description?: string
}

export default function ThemeActions({ 
  themeId: _themeId, 
  isPro, 
  content, 
  colors, 
  name,
  images = [],
  price: _price = 49.99,
  originalPrice: _originalPrice = 99.99,
  description: _description = ''
}: ThemeActionsProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!content || !colors || !name) {
      alert('Theme data is incomplete.')
      return
    }

    setLoading(true)
    try {
      const blob = await generateShopifyTheme(name, content, colors, images)
      saveAs(blob, `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`)
    } catch (e) {
      console.error(e)
      alert('Failed to generate theme files.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-token bg-elevated p-4 md:static md:border-0 md:bg-transparent md:p-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="hidden md:block">
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground">
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="flex w-full items-center justify-end gap-3 md:w-auto">
          {!isPro && (
            <Link href="/pricing" className="hidden text-sm font-medium text-primary hover:underline sm:block">
              Upgrade to Export
            </Link>
          )}
          <button 
            onClick={handleDownload}
            className="flex-1 rounded-full bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 md:flex-none"
          >
            {loading ? 'Processing...' : 'Download Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}
