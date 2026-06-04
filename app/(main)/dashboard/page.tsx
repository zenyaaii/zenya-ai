"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AIDisclosure from '@/components/AIDisclosure'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [themes, setThemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)
  const [plan, setPlan] = useState('free')
  
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const r = await fetch('/api/themes')
      if (r.ok) {
        const j = await r.json()
        setThemes(j.themes || [])
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.is_pro) {
        setPlan('active')
      }
      
      setLoading(false)
    }
    load()
  }, [router, supabase])

  async function subscribe() {
    setSubLoading(true)
    const r = await fetch('/api/checkout', { method: 'POST' })
    const j = await r.json()
    setSubLoading(false)
    if (j.url) window.location.href = j.url
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-token pb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${plan === 'active' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
              {plan === 'active' ? 'Pro (Lifetime)' : 'Free Plan'}
            </div>
            {plan !== 'active' && (
              <button onClick={subscribe} disabled={subLoading} className="text-sm font-medium text-primary hover:underline">
                {subLoading ? '...' : 'Get Lifetime Pro'}
              </button>
            )}
          </div>
        </div>
        
        <Link 
          href="/theme/new" 
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105 hover:shadow-xl"
        >
          <span>+</span> Create New Theme
        </Link>
      </div>

      <AIDisclosure variant="banner" className="mt-6" />

      {loading ? (
        <div className="mt-12 text-center text-muted">Loading your themes...</div>
      ) : themes.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-token p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-2xl">✨</div>
          <h3 className="mt-4 text-lg font-medium text-foreground">No themes yet</h3>
          <p className="mt-2 text-muted">Create your first high-converting store theme.</p>
          <Link href="/theme/new" className="mt-6 inline-block text-primary hover:underline">Create Theme &rarr;</Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map(t => (
            <Link key={t.id} href={`/preview/${t.id}`} className="group relative overflow-hidden rounded-2xl border border-token bg-elevated p-6 shadow-soft-sm transition hover:-translate-y-1 hover:shadow-soft-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary" />
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-primary">{t.product_name}</h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  Ready to publish
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
