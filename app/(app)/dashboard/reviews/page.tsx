'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { businessTypeOf, type ThemeRow } from '@/components/dashboard/site-kinds'
import {
  deleteReview, hasReviews, markSeen, mergeGoogleCounted, moveReview, readReviews, saveReview, toggleReview,
} from '@/lib/reviews-bank'
import V6Reviews from '@/components/app/v6/pages/Reviews'
import { ago } from '@/components/app/v6/pages/kit'
import { useSite } from '@/components/app/v6/site'

/** What /api/reviews/google says when it cannot help, in the owner's words. */
const FETCH_ERRORS: Record<string, string> = {
  not_configured: 'جلب التقييمات من Google غير مفعّل بعد. أضف تقييماتك بيدك.',
  sign_in: 'انتهت جلستك. سجّل الدخول مرة أخرى.',
  not_google_link: 'هذا ليس رابط خرائط Google. افتح نشاطك على خرائط Google واضغط «مشاركة» وانسخ الرابط.',
  not_found: 'لم نجد نشاطك على Google من هذا الرابط. جرّب رابط «مشاركة» من خرائط Google.',
  too_many: 'حاولت كثيرًا خلال ساعة. جرّب بعد قليل.',
}

/**
 * Reviews: which reviews each of the owner's sites shows. The list and the
 * set-aside ones live in the site's own content (see lib/reviews-bank), so a
 * change here is a PATCH of that content and the public site picks it up on
 * its next revalidate.
 */
export default function ReviewsPage() {
  const router = useRouter()
  const ctx = useSite()
  const [themes, setThemes] = useState<ThemeRow[] | null>(null)
  const [siteId, setSiteId] = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { router.push('/login?next=/dashboard/reviews'); return }
    const res = await fetch('/api/themes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] }))
    const list: ThemeRow[] = (res?.themes || []).filter((t: ThemeRow) => hasReviews(businessTypeOf(t)))
    setThemes(list)
    const wanted = new URLSearchParams(window.location.search).get('site') || ctx?.siteId
    setSiteId((cur) => cur || (list.find((t) => t.id === wanted) || list[0])?.id || '')
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const theme = themes?.find((t) => t.id === siteId) || null
  const bt = theme ? businessTypeOf(theme) : ''
  const view = useMemo(() => (theme ? readReviews(bt, theme.content) : null), [theme, bt])

  /**
   * Reviews marked new stay marked for this visit, even though we clear the
   * mark in the database as soon as the owner opens the site here: next
   * visit they are no longer new, and the bell stops counting them.
   */
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const seenFor = useRef<string>('')
  useEffect(() => {
    if (!theme || seenFor.current === theme.id) return
    seenFor.current = theme.id
    setFresh(new Set((view?.rows || []).filter((r) => r.isNew).map((r) => r.name + '|' + r.text)))
    const cleared = markSeen(bt, theme.content)
    if (cleared) {
      setThemes((ts) => ts && ts.map((t) => (t.id === theme.id ? { ...t, content: cleared } : t)))
      fetch(`/api/themes/${theme.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: cleared }),
      }).catch(() => {})
    }
  }, [theme, bt, view])

  /** Apply a change at once, then save it. A failed save puts it back. */
  const commit = useCallback(async (next: any): Promise<boolean> => {
    if (!theme) return false
    const before = theme.content
    setThemes((ts) => ts && ts.map((t) => (t.id === theme.id ? { ...t, content: next } : t)))
    const res = await fetch(`/api/themes/${theme.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: next }),
    }).catch(() => null)
    if (!res || !res.ok) {
      setThemes((ts) => ts && ts.map((t) => (t.id === theme.id ? { ...t, content: before } : t)))
      return false
    }
    return true
  }, [theme])

  if (!themes) return null

  const g = view?.google
  return (
    <V6Reviews
      sites={themes.map((t) => ({ id: t.id, name: t.product_name || 'موقع بلا اسم' }))}
      siteId={siteId}
      onSite={(id) => { setSiteId(id); if (ctx && ctx.themes?.some((t) => t.id === id)) ctx.setSiteId(id) }}
      source={g ? { link: g.link, rating: g.rating, count: g.count, fetched: g.fetched_at ? ago(g.fetched_at) : '' } : null}
      heading={view?.heading || ''}
      reviews={(view?.rows || []).map((r) => ({
        id: r.id, name: r.name, rating: r.rating, text: r.text, origin: r.origin, shown: r.shown,
        at: r.origin === 'manual' ? 'أضفته أنت' : r.at ? ago(r.at) : r.when || '',
        isNew: fresh.has(r.name + '|' + r.text),
      }))}
      fetchGoogle={async (link) => {
        if (!theme) return { error: 'اختر موقعًا أولًا.', added: 0 }
        try {
          const res = await fetch('/api/reviews/google', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link, name: theme.content?.brand?.name || theme.product_name || '' }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) return { error: FETCH_ERRORS[data?.error] || 'تعذّر الوصول إلى Google الآن. جرّب بعد قليل.', added: 0 }
          const { content, added } = mergeGoogleCounted(bt, theme.content, data.place?.url || link, data)
          // Just fetched, so the owner is looking at them now: badge them for this visit, not the next.
          const arrived = readReviews(bt, content).rows.filter((r) => r.isNew).map((r) => r.name + '|' + r.text)
          setFresh((f) => new Set([...f, ...arrived]))
          const ok = await commit(markSeen(bt, content) || content)
          return ok ? { error: null, added } : { error: 'لم يُحفظ التغيير. تأكد من اتصالك وحاول مرة أخرى.', added: 0 }
        } catch {
          return { error: 'تعذّر الوصول إلى Google الآن. جرّب بعد قليل.', added: 0 }
        }
      }}
      toggle={(id) => (theme ? commit(toggleReview(bt, theme.content, id)) : Promise.resolve(false))}
      save={(id, v) => (theme ? commit(saveReview(bt, theme.content, id, v)) : Promise.resolve(false))}
      move={(id, to) => (theme ? commit(moveReview(bt, theme.content, id, to)) : Promise.resolve(false))}
      remove={async (id) => {
        if (!theme) return null
        const before = theme.content
        if (!(await commit(deleteReview(bt, before, id)))) return null
        return () => { commit(before) }
      }}
    />
  )
}
