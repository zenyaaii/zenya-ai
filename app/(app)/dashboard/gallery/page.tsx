'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import V6Gallery, { type V6Asset } from '@/components/app/v6/pages/Gallery'
import { useSite } from '@/components/app/v6/site'
import { useV6 } from '@/components/app/v6/ui'
import { businessTypeOf } from '@/components/dashboard/site-kinds'

type GalleryImage = {
  id: string
  url: string
  name: string | null
  bytes: number | null
  created_at: string
}

/** Where on a site a picture sits, by the part of the content that holds it. */
const PART: Record<string, string> = {
  hero: 'الصفحة الرئيسية', brand: 'الشعار', seo: 'نتيجة جوجل', gallery: 'معرض الصور', menu: 'قائمة الطعام',
  signature_dishes: 'الأطباق المميزة', story: 'من نحن', about: 'من نحن', services: 'الخدمات', team: 'الفريق',
  testimonials: 'التقييمات', reviews: 'التقييمات', products: 'المنتجات', collections: 'المجموعات',
}

type Use = { sites: string[]; used: string }

/** Which sites use each address, and where on the first of them. */
function usage(themes: { id: string; content?: any; template_type?: string | null }[]): Map<string, Use> {
  const m = new Map<string, Use>()
  for (const t of themes) {
    const bt = businessTypeOf(t as any)
    const c = t.content?.[bt] && typeof t.content[bt] === 'object' ? t.content[bt] : t.content || {}
    for (const [k, v] of Object.entries(c)) {
      const json = JSON.stringify(v ?? '')
      for (const url of json.match(/https?:\/\/[^"\\\s]+/g) || []) {
        const u = m.get(url) || { sites: [], used: '' }
        if (!u.sites.includes(t.id)) u.sites.push(t.id)
        if (!u.used) u.used = PART[k] || 'صفحات الموقع'
        m.set(url, u)
      }
    }
  }
  return m
}

/** Gallery: the v6 design's gallery page, on the owner's real image library. */
export default function GalleryPage() {
  const { toast } = useV6()
  const ctx = useSite()
  const [images, setImages] = useState<GalleryImage[] | null>(null)

  const load = useCallback(async (): Promise<GalleryImage[]> => {
    try {
      const r = await fetch('/api/gallery', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error()
      const list = (j.images || []) as GalleryImage[]
      setImages(list)
      return list
    } catch {
      setImages((a) => a || [])
      toast('تعذّر تحميل المعرض', { ok: false })
      return []
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const themes = ctx?.themes
  const uses = useMemo(() => usage(themes || []), [themes])
  const assets = useMemo<V6Asset[] | null>(() => images && images.map((i) => {
    const u = uses.get(i.url)
    return { id: i.id, url: i.url, name: i.name || 'بلا عنوان', bytes: i.bytes, sites: u?.sites || [], used: u?.used || 'لم تُستخدم بعد' }
  }), [images, uses])

  if (!assets || !themes) return null

  return (
    <V6Gallery
      assets={assets}
      sites={themes.map((t) => ({ id: t.id, name: t.product_name || 'موقع بلا اسم' }))}
      upload={async (files) => {
        const before = new Set(assets.map((a) => a.id))
        const failed: string[] = []
        for (const file of files) {
          const form = new FormData()
          form.append('file', file)
          const r = await fetch('/api/upload', { method: 'POST', body: form }).catch(() => null)
          if (!r || !r.ok) failed.push(file.name)
        }
        const list = await load()
        return { added: list.filter((a) => !before.has(a.id)).map((a) => a.id), failed }
      }}
      remove={async (id) => {
        const r = await fetch(`/api/gallery/${id}`, { method: 'DELETE' }).catch(() => null)
        if (r?.ok) setImages((a) => (a || []).filter((x) => x.id !== id))
        return !!r?.ok
      }}
    />
  )
}
