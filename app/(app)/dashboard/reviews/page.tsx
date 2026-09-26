'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ReviewsScreen, type ReviewDraft } from '@/components/dashboard/screens/reviews'
import { EmptyHint, relTime } from '@/components/dashboard/screens/kit'
import { businessTypeOf, type ThemeRow } from '@/components/dashboard/site-kinds'
import {
  deleteReview, hasReviews, mergeGoogle, readReviews, saveReview, toggleReview,
} from '@/lib/reviews-bank'

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
  const [themes, setThemes] = useState<ThemeRow[] | null>(null)
  const [siteId, setSiteId] = useState('')
  const [draftLink, setDraftLink] = useState('')
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const load = useCallback(async () => {
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { router.push('/login?next=/dashboard/reviews'); return }
    const res = await fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] }))
    const list: ThemeRow[] = (res?.themes || []).filter((t: ThemeRow) => hasReviews(businessTypeOf(t)))
    setThemes(list)
    const wanted = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('site') : null
    setSiteId((cur) => cur || (list.find((t) => t.id === wanted) || list[0])?.id || '')
  }, [router])

  useEffect(() => { load() }, [load])

  const theme = themes?.find((t) => t.id === siteId) || null
  const bt = theme ? businessTypeOf(theme) : ''
  const view = useMemo(() => (theme ? readReviews(bt, theme.content) : null), [theme, bt])

  /** Apply a change locally at once, then save it. A failed save puts it back. */
  async function commit(next: any) {
    if (!theme) return
    const before = theme.content
    setThemes((ts) => ts && ts.map((t) => (t.id === theme.id ? { ...t, content: next } : t)))
    setSaveState('saving')
    setError('')
    const res = await fetch(`/api/themes/${theme.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: next }),
    }).catch(() => null)
    if (!res || !res.ok) {
      setThemes((ts) => ts && ts.map((t) => (t.id === theme.id ? { ...t, content: before } : t)))
      setSaveState('idle')
      setError('لم يُحفظ التغيير. تأكد من اتصالك وحاول مرة أخرى.')
      return
    }
    setSaveState('saved')
  }

  async function fetchGoogle() {
    if (!theme || fetching) return
    const link = (view?.google?.link || draftLink).trim()
    if (!link) { setError('ألصق رابط نشاطك على خرائط Google أولًا.'); return }
    setFetching(true)
    setError('')
    try {
      const res = await fetch('/api/reviews/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link, name: theme.content?.brand?.name || theme.product_name || '' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(FETCH_ERRORS[data?.error] || 'تعذّر الوصول إلى Google الآن. جرّب بعد قليل.'); return }
      await commit(mergeGoogle(bt, theme.content, data.place?.url || link, data))
    } finally {
      setFetching(false)
    }
  }

  if (!themes) return null

  const sites = themes.map((t) => ({ id: t.id, name: t.product_name || 'موقع بلا اسم' }))
  const g = view?.google

  return (
    <ReviewsScreen
      sites={sites}
      siteId={siteId}
      setSiteId={(id) => { setSiteId(id); setError(''); setSaveState('idle'); setDraftLink('') }}
      source={g ? { link: g.link, rating: g.rating, count: g.count, fetched: g.fetched_at ? relTime(g.fetched_at) : undefined } : null}
      draftLink={draftLink}
      setDraftLink={setDraftLink}
      fetching={fetching}
      onFetch={{ onClick: fetchGoogle, disabled: fetching }}
      error={error}
      saveState={saveState}
      heading={view?.heading || ''}
      reviews={(view?.rows || []).map((r) => ({ ...r }))}
      onToggle={(id) => theme && commit(toggleReview(bt, theme.content, id))}
      onSave={(id, v: ReviewDraft) => theme && commit(saveReview(bt, theme.content, id, v))}
      onDelete={(id) => theme && commit(deleteReview(bt, theme.content, id))}
      empty={themes.length === 0 ? (
        <EmptyHint>لا يوجد عندك موقع فيه قسم تقييمات بعد. أنشئ موقعًا وسيظهر هنا.</EmptyHint>
      ) : undefined}
    />
  )
}
