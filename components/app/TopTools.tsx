'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useT } from '@/components/i18n/LocaleProvider'
import { useDashboardPath } from './useDashboardPath'
import { NotificationsBell, type BellItem } from './NotificationsBell'
import { whenLabel } from '@/components/dashboard/screens/reviews'
import { INTRO_REPLAY_EVENT } from './intro/DashIntro'
import { siteUrl } from '@/lib/portal-urls'
import { Ic, useV6 } from './v6/ui'

/**
 * The end of the dashboard's top bar: the bell and the account button, as
 * the v6 design draws them. The frame (v6/Frame) draws the bar itself, the
 * site switcher, search and the theme switch; these are the parts that need
 * the signed-in user.
 */
export default function TopTools({
  user, plan, demo,
}: {
  user: { id: string; email?: string | null; user_metadata?: any } | null
  /** The plan's short name for the pill in the account popover: «Pro». */
  plan?: { label: string; tone: 'ok' | 'acc' | '' } | null
  /** The demo's sample owner: no account behind it, and its rows switch views. */
  demo?: { name: string; email: string; bell: BellItem[]; go: (page: string) => void }
}) {
  const router = useRouter()
  const { pathname, linkTo } = useDashboardPath()
  const supabase = createClient()
  const t = useT()
  const { openPop, closePop, dark, toggleTheme, toast } = useV6()

  // The bell: sites whose daily Google check found reviews the owner has not seen.
  const [news, setNews] = useState<{ id: string; name: string; count: number; at: string | null }[]>([])
  useEffect(() => {
    if (!user) return
    fetch('/api/reviews/new').then((r) => (r.ok ? r.json() : { sites: [] })).then((d) => setNews(d.sites || [])).catch(() => {})
  }, [user, pathname])

  // And a site Beynoun handed over to this account, until the owner answers it.
  const [handover, setHandover] = useState<{ token: string; site: string; host: string; plan: string; sent_at?: string; done?: boolean } | null>(null)
  useEffect(() => {
    if (!user) return
    fetch('/api/handover').then((r) => (r.ok ? r.json() : null)).then((d) => setHandover(d?.handover || null)).catch(() => {})
  }, [user, pathname])

  // And notices from Beynoun with a link, until the owner opens them.
  const [notices, setNotices] = useState<{ id: string; title: string; body: string | null; href: string | null; created_at: string }[]>([])
  useEffect(() => {
    if (!user) return
    fetch('/api/notices').then((r) => (r.ok ? r.json() : { notices: [] })).then((d) => setNotices(d.notices || [])).catch(() => {})
  }, [user, pathname])

  async function answerYes() {
    if (!handover) return
    const r = await fetch(`/api/handover/${encodeURIComponent(handover.token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'yes' }),
    }).catch(() => null)
    if (r?.ok) setHandover({ ...handover, done: true })
  }

  const handoverItems: BellItem[] = handover ? [{
    id: `handover-${handover.token}`,
    title: `موقع «${handover.site}» أصبح في حسابك`,
    site: handover.site,
    when: whenLabel(handover.sent_at, ''),
    handover: {
      host: handover.host,
      plan: handover.plan,
      done: handover.done,
      onYes: answerYes,
      noHref: siteUrl(`/handover/${encodeURIComponent(handover.token)}?a=no`),
    },
  }] : []

  const noticeItems: BellItem[] = notices.map((n) => ({
    id: `notice-${n.id}`,
    title: n.title,
    site: n.body || 'من فريق بينون',
    when: whenLabel(n.created_at, ''),
    href: n.href || undefined,
    external: true,
    kind: 'notice',
    onOpen: () => {
      fetch(`/api/notices/${encodeURIComponent(n.id)}`, { method: 'POST' }).catch(() => {})
      setNotices((all) => all.filter((x) => x.id !== n.id))
    },
  }))

  const bellItems: BellItem[] = demo ? demo.bell : [...handoverItems, ...noticeItems, ...news.map((s) => ({
    id: s.id,
    title: s.count === 1 ? 'تقييم جديد من Google' : s.count === 2 ? 'تقييمان جديدان من Google' : `${s.count} تقييمات جديدة من Google`,
    site: s.name,
    when: whenLabel(s.at || undefined, ''),
    href: linkTo(`/dashboard/reviews?site=${s.id}`),
  }))]

  const fullName = (demo?.name ?? user?.user_metadata?.full_name) as string | undefined
  const firstName = fullName?.split(' ')[0]
  const email = demo?.email ?? user?.email ?? ''
  const initial = (firstName || email)[0]?.toUpperCase() || '?'

  async function signOut() {
    closePop()
    if (demo) return toast('هذه نسخة تجريبية، لا حساب لتخرج منه', { ok: false })
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('zenya_email')
      localStorage.removeItem('zenya_last_email')
    } catch {}
    router.push('/')
    router.refresh()
  }

  const account = (
    <>
      <div className="who">
        <span className="me" aria-hidden>{initial}</span>
        <span className="trunc" style={{ flex: 1 }}><b>{fullName || t.nav.yourAccount}</b><span className="trunc">{email}</span></span>
        {plan && <span className={`pill ${plan.tone}`}>{plan.label}</span>}
      </div>
      <hr />
      {demo ? (
        <>
          <button className="pi" onClick={() => { closePop(); demo.go('settings') }}><span className="tile"><Ic n="settings" /></span><span className="tx"><b>الإعدادات</b></span></button>
          <button className="pi" onClick={() => { closePop(); demo.go('billing') }}><span className="tile"><Ic n="card" /></span><span className="tx"><b>الفوترة والباقة</b></span></button>
        </>
      ) : (
        <>
          <Link className="pi" href={linkTo('/dashboard/settings')} onClick={() => closePop()}><span className="tile"><Ic n="settings" /></span><span className="tx"><b>الإعدادات</b></span></Link>
          <Link className="pi" href={linkTo('/dashboard/billing')} onClick={() => closePop()}><span className="tile"><Ic n="card" /></span><span className="tx"><b>الفوترة والباقة</b></span></Link>
        </>
      )}
      <button className="pi" onClick={() => { closePop(); toggleTheme() }}><span className="tile"><Ic n={dark ? 'sun' : 'moon'} /></span><span className="tx"><b>{dark ? 'الوضع الفاتح' : 'الوضع الليلي'}</b></span></button>
      <button className="pi" onClick={() => { closePop(); window.dispatchEvent(new Event('v6:help')) }}><span className="tile"><Ic n="help" /></span><span className="tx"><b>المساعدة والإبلاغ عن مشكلة</b></span></button>
      <button className="pi" onClick={() => { closePop(); window.dispatchEvent(new Event(INTRO_REPLAY_EVENT)) }}><span className="tile"><Ic n="sparkle" /></span><span className="tx"><b>{t.intro.replay}</b></span></button>
      <hr />
      <button className="pi" onClick={signOut}><span className="tile bad"><Ic n="logout" /></span><span className="tx"><b>{t.accounts.signOut}</b></span></button>
    </>
  )

  return (
    <>
      {/* Notifications: a site handed over to this account, and new Google reviews. */}
      <NotificationsBell items={bellItems} label={t.nav.notifications} />
      <button
        className="me press" data-tour="account" aria-label={t.nav.accountMenu}
        aria-haspopup="true" aria-expanded="false"
        onClick={(e) => openPop(e.currentTarget, account, 300)}
      >
        {initial}
      </button>
    </>
  )
}
