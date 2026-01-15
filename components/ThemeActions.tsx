"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateShopifyTheme } from '@/utils/shopify-generator'
import { saveAs } from 'file-saver'
import { useSearchParams } from 'next/navigation'

type ThemeActionsProps = {
  themeId: string
  isPro: boolean
  content?: any
  colors?: { primary: string; secondary: string }
  name?: string
}

export default function ThemeActions({ themeId, isPro, content, colors, name }: ThemeActionsProps) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const shopParam = searchParams.get('shop')
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    // Simple check: if 'shop' param exists or we are in an iframe
    if (shopParam || (typeof window !== 'undefined' && window.self !== window.top)) {
      setIsEmbedded(true)
    }
  }, [shopParam])

  async function handleDownload() {
    if (!isPro) {
      setLoading(true)
      try {
        const res = await fetch('/api/checkout', { method: 'POST' })
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
             if (!res.ok) throw new Error(`Server error: ${res.status}`);
             throw new Error('Invalid response');
        }

        if (data.url) {
          window.location.href = data.url
        } else {
          alert('Failed to start checkout.')
        }
      } catch (e) {
        console.error(e)
        alert('Checkout error')
      } finally {
        setLoading(false)
      }
      return
    }
    
    if (!content || !colors || !name) {
      alert('Theme data is incomplete.')
      return
    }

    setLoading(true)
    try {
      const blob = await generateShopifyTheme(name, content, colors)
      saveAs(blob, `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`)
    } catch (e) {
      console.error(e)
      alert('Failed to generate theme files.')
    } finally {
      setLoading(false)
    }
  }

  async function handleShopify() {
    if (!isPro) {
      alert('Upgrade to Pro to connect to Shopify.')
      return
    }
    
    let shopDomain = shopParam

    // If not embedded, ask for shop
    if (!isEmbedded) {
        const shop = prompt("Enter your Shopify store URL (e.g. my-store.myshopify.com):")
        if (!shop) return
        shopDomain = shop.trim()
        // Basic cleanup
        shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
        if (!shopDomain.includes('.')) {
            shopDomain += '.myshopify.com'
        }
    }

    setLoading(true)
    try {
        const res = await fetch('/api/shopify/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shop: shopDomain,
                themeData: {
                    productName: name,
                    content,
                    colors
                }
            })
        })
        
        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
             // If not JSON (e.g. 405 HTML page or empty), handle gracefully
             if (!res.ok) {
                 throw new Error(`Server error: ${res.status} ${res.statusText}`);
             }
             throw new Error('Invalid server response (not JSON)');
        }
        
        if (res.status === 401 || data.error?.includes('No session') || data.error?.includes('session')) {
            const install = confirm(`We need to connect to ${shopDomain} first. Click OK to authorize Zenya.`)
            if (install) {
                // Redirect to auth
                window.location.href = `/api/shopify/auth?shop=${shopDomain}`
            }
        } else if (data.success) {
            alert(`Theme "${name}" published successfully to ${shopDomain}! \n\nCheck your Online Store > Themes library (it will be unpublished).`)
            if (data.warning) {
                alert('Warning: ' + data.warning)
            }
        } else {
            alert('Failed: ' + (data.error || data.details || 'Unknown error'))
        }

    } catch (e) {
        console.error(e)
        alert('Connection failed. Check console for details.')
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
            onClick={handleShopify}
            disabled={loading || !isPro}
            className={`flex-1 rounded-full border border-token px-6 py-3 font-bold transition md:flex-none ${
              !isPro ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface'
            }`}
          >
            {loading ? 'Processing...' : (
                isEmbedded ? 'Install to Store 🚀' : `Connect Shopify ${!isPro ? '🔒' : ''}`
            )}
          </button>
          
          {/* Creator Bypass Button - Always visible for local testing */}
          <button 
            onClick={() => {
              if (content && colors && name) {
                 generateShopifyTheme(name, content, colors).then(blob => {
                   saveAs(blob, `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`)
                 })
              }
            }}
            className="flex-none rounded-full bg-gray-800 px-4 py-3 font-bold text-white transition hover:bg-gray-700 md:hidden lg:block"
            title="Dev Download"
          >
            Dev ⚡
          </button>

          <button 
            onClick={handleDownload}
            className={`flex-1 rounded-full px-8 py-3 font-bold text-white shadow-lg transition md:flex-none ${
              !isPro 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:scale-105 hover:shadow-orange-500/25' 
                : 'bg-primary shadow-primary/25 hover:scale-105'
            }`}
          >
            {loading ? 'Processing...' : !isPro ? 'Get Pro Plan ($4.99/mo)' : 'Download Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}
