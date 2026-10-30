'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'
import { NOTIFICATION_PREFS, readPrefs, type NotificationPrefs } from '@/lib/notification-prefs'
import V6Settings from '@/components/app/v6/pages/Settings'
import { useSite } from '@/components/app/v6/site'

const SUB: Record<keyof NotificationPrefs, string> = {
  booking: 'بريد فور وصول كل حجز',
  review: 'عندما يكتب أحد تقييمًا على Google',
  product: 'مزايا جديدة، مرة في الشهر',
  offers: 'خصومات على الباقات والنطاقات',
}

/** «قبل 3 أشهر» */
function since(iso: string): string {
  const days = (Date.now() - new Date(iso).getTime()) / 864e5
  if (!(days >= 0)) return ''
  const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' })
  if (days < 1) return 'اليوم'
  if (days < 30) return rtf.format(-Math.round(days), 'day')
  if (days < 365) return rtf.format(-Math.round(days / 30), 'month')
  return rtf.format(-Math.round(days / 365), 'year')
}

/** Settings: the v6 design's settings page, on the owner's real account. */
export default function SettingsClient() {
  const router = useRouter()
  const ctx = useSite()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?next=/dashboard/settings'); return }
      setUser(user)
    })
  }, [router])

  if (!user) return null

  const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const prefs = readPrefs(user.user_metadata?.notification_prefs)
  const providers: string[] = user.app_metadata?.providers || (user.app_metadata?.provider ? [user.app_metadata.provider] : [])
  const hasPassword = providers.includes('email')
  // Set when the password changes here; older accounts have no date to show.
  const changed = user.user_metadata?.pw_changed_at
  const pwNote = !hasPassword ? 'تدخل بحساب Google. يمكنك إضافة كلمة مرور' : changed ? 'غيّرتها ' + since(changed) : 'غيّرها متى شئت'

  return (
    <V6Settings
      name={name}
      email={user.email || ''}
      saveAccount={async (n, e) => {
        const supabase = createClient()
        try {
          if (n !== name) {
            const { data, error } = await supabase.auth.updateUser({ data: { full_name: n } })
            if (error) throw error
            if (data.user) setUser(data.user)
          }
          if (e !== user.email) {
            const { error } = await supabase.auth.updateUser({ email: e })
            if (error) throw error
            return { ok: true, msg: 'أرسلنا رابط تأكيد إلى بريدك الجديد' }
          }
          return { ok: true, msg: 'تم الحفظ' }
        } catch {
          return { ok: false, msg: 'تعذّر الحفظ. حاول مرة أخرى.' }
        }
      }}
      hasPassword={hasPassword}
      pwNote={pwNote}
      changePassword={async (current, next) => {
        const supabase = createClient()
        if (hasPassword) {
          const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
          if (error) return 'كلمة المرور الحالية غير صحيحة.'
        }
        const { data, error } = await supabase.auth.updateUser({ password: next, data: { pw_changed_at: new Date().toISOString() } })
        if (!error && data.user) setUser(data.user)
        if (error) return /same|different/i.test(error.message) ? 'اختر كلمة مرور غير الحالية.' : 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.'
        return null
      }}
      signOutOthers={async () => {
        const { error } = await createClient().auth.signOut({ scope: 'others' })
        return !error
      }}
      notices={NOTIFICATION_PREFS.map((p) => ({ key: p.key, label: p.label, sub: SUB[p.key], on: prefs[p.key] }))}
      setNotice={async (key, on) => {
        const supabase = createClient()
        const { data: { user: fresh } } = await supabase.auth.getUser()
        const next = { ...readPrefs(fresh?.user_metadata?.notification_prefs), [key]: on }
        const { error } = await supabase.auth.updateUser({ data: { notification_prefs: next } })
        return !error
      }}
      englishReady={ENGLISH_ENABLED}
      sites={ctx?.themes?.length || 0}
      deleteAccount={async () => {
        const res = await fetch('/api/account/delete', { method: 'POST' }).catch(() => null)
        if (!res?.ok) return false
        await createClient().auth.signOut()
        router.push('/?account_deleted=1')
        return true
      }}
    />
  )
}
