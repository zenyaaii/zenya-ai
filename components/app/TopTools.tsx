'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LayoutDashboard, Settings, LogOut, Compass } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useT } from '@/components/i18n/LocaleProvider'
import { dashFont } from './dash-font'
import LanguageSwitcher from '@/components/marketing/LanguageSwitcher'
import { useDashboardPath } from './useDashboardPath'
import { NotificationsBell, type BellItem } from './NotificationsBell'
import { whenLabel } from '@/components/dashboard/screens/reviews'
import { INTRO_REPLAY_EVENT } from './intro/DashIntro'
import { siteUrl } from '@/lib/portal-urls'

const DROPDOWN_EASE = [0.22, 1, 0.36, 1] as const

/**
 * The end of the dashboard's top bar: language, the bell and the account
 * menu. The frame (DashFrame) draws the bar itself, the title, search and
 * the theme switch; these are the parts that need the signed-in user.
 */
export default function TopTools({
  user,
}: {
  user: { id: string; email?: string | null; user_metadata?: any } | null
}) {
  const router = useRouter()
  const { pathname, linkTo } = useDashboardPath()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useT()

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

  const bellItems: BellItem[] = [...handoverItems, ...news.map((s) => ({
    id: s.id,
    title: s.count === 1 ? 'تقييم جديد من Google' : s.count === 2 ? 'تقييمان جديدان من Google' : `${s.count} تقييمات جديدة من Google`,
    site: s.name,
    when: whenLabel(s.at || undefined, ''),
    href: linkTo(`/dashboard/reviews?site=${s.id}`),
  }))]

  const fullName = user?.user_metadata?.full_name as string | undefined
  const firstName = fullName?.split(' ')[0]
  const email = user?.email || ''
  const initial = (firstName || email)[0]?.toUpperCase() || '?'

  async function signOut() {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('zenya_email')
      localStorage.removeItem('zenya_last_email')
    } catch {}
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
    {/* Language. Flips the locale in place rather than navigating, so the
        user keeps whatever page and state they were on. */}
    <LanguageSwitcher variant="inline" className="hidden xl:inline-flex" />

    {/* Notifications: a site handed over to this account, and new Google reviews. */}
    <NotificationsBell items={bellItems} label={t.nav.notifications} />

    {/* Profile dropdown */}
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="zy-top-acct"
              data-tour="account"
          aria-label={t.nav.accountMenu}
        >
          <div className="zy-top-av">{initial}</div>
        </button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {menuOpen && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content
              asChild
              forceMount
              align="end"
              sideOffset={6}
              className="z-50"
            >
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: DROPDOWN_EASE }}
                /* The portal lands OUTSIDE the shell, so the menu carries the
                   token scope and the chrome face itself. Without zy-tokens
                   here every var() below it resolves to nothing. */
                className={`zy-tokens zy-dash zy-menu ${dashFont.variable} w-56 overflow-hidden`}
              >
                <div className="zy-menu-head">
                  <p className="text-[13px] font-bold leading-[1.5] text-[#171717]">
                    {fullName || t.nav.yourAccount}
                  </p>
                  <p className="truncate text-[12px] leading-[1.6] text-[#66666e]">{email}</p>
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href={linkTo('/dashboard')}
                    onClick={() => setMenuOpen(false)}
                    className="zy-menu-row"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
                    {t.nav.home}
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href={linkTo('/dashboard/settings')}
                    onClick={() => setMenuOpen(false)}
                    className="zy-menu-row"
                  >
                    <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                    {t.nav.settings}
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))
                    }}
                    className="zy-menu-row"
                  >
                    <Compass className="h-3.5 w-3.5" strokeWidth={2} />
                    {t.intro.replay}
                  </button>
                </DropdownMenu.Item>

                <div className="mt-1 border-t border-[rgba(17,17,17,0.07)] pt-1">
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={signOut}
                      className="zy-menu-row"
                      data-tone="danger"
                    >
                      <LogOut className="h-3.5 w-3.5 rtl-flip" strokeWidth={2} />
                      {t.accounts.signOut}
                    </button>
                  </DropdownMenu.Item>
                </div>
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
    </>
  )
}
