'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNotify } from '@/components/ui/Notify'
import { GalleryScreen } from '@/components/dashboard/screens/gallery'
import { fmtBytes } from '@/components/dashboard/screens/kit'

type GalleryImage = {
  id: string
  url: string
  name: string | null
  bytes: number | null
  source: 'upload' | 'theme' | 'external'
}

const SOURCE_LABEL: Record<GalleryImage['source'], string> = {
  upload: 'مرفوعة',
  theme: 'من موقع',
  external: 'رابط خارجي',
}

/** Gallery: the demo's gallery screen, on the owner's real image library. */
export default function GalleryPage() {
  const { toast } = useNotify()
  const [images, setImages] = useState<GalleryImage[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/gallery')
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error)
      setImages(j.images || [])
    } catch {
      setImages([])
      toast({ type: 'error', message: 'تعذّر تحميل المعرض' })
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: form })
        if (!r.ok) throw new Error(file.name)
      }
      await load()
    } catch (e: any) {
      toast({ type: 'error', message: 'تعذّر رفع الملف', description: e?.message })
    } finally {
      setUploading(false)
    }
  }

  if (!images) return null

  const total = images.reduce((a, i) => a + (i.bytes || 0), 0)

  return (
    <>
      <GalleryScreen
        assets={images.map((i) => ({
          id: i.id,
          name: i.name || 'بلا عنوان',
          site: SOURCE_LABEL[i.source] || '',
          size: i.bytes ? fmtBytes(i.bytes) : '—',
          url: i.url,
          open: { href: i.url, external: true },
        }))}
        usedLabel={`${fmtBytes(total)} مستخدمة`}
        upload={{ onClick: () => fileRef.current?.click(), disabled: uploading }}
        uploading={uploading}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { upload(e.target.files); e.target.value = '' }}
      />
    </>
  )
}
