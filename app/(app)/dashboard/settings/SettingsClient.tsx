'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useNotify } from '@/components/ui/Notify'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { ENGLISH_ENABLED } from '@/lib/i18n/config'
import { SettingsScreen } from '@/components/dashboard/screens/settings'
import { NOTIFICATION_PREFS, readPrefs, type NotificationPrefs } from '@/lib/notification-prefs'

/** Settings: the demo's settings screen, on the owner's real account. */
export default function SettingsClient() {
  const router = useRouter()
  const { toast, confirm } = useNotify()
  const { locale, setLocale } = useLocale()
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState({ name: '', email: '' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [prefs, setPrefs] = useState<NotificationPrefs>(readPrefs(null))
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?next=/dashboard/settings'); return }
      const n = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setSaved({ name: n, email: user.email || '' })
      setName(n)
      setEmail(user.email || '')
      setPrefs(readPrefs(user.user_metadata?.notification_prefs))
      setLoaded(true)
    })
  }, [router])

  async function save() {
    const supabase = createClient()
    setSaving(true)
    setNote(null)
    try {
      if (name.trim() !== saved.name) {
        const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
        if (error) throw error
      }
      if (email.trim() && email.trim() !== saved.email) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() })
        if (error) throw error
        setNote({ tone: 'ok', text: 'أرسلنا رابط تأكيد إلى بريدك القديم والجديد لإتمام التغيير.' })
      } else {
        setNote({ tone: 'ok', text: 'تم الحفظ.' })
      }
      setSaved({ name: name.trim(), email: saved.email })
    } catch (e: any) {
      setNote({ tone: 'bad', text: e?.message || 'تعذّر الحفظ.' })
    } finally {
      setSaving(false)
    }
  }

  async function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    const { error } = await createClient().auth.updateUser({ data: { notification_prefs: next } })
    if (error) {
      setPrefs(prefs)
      toast({ type: 'error', message: 'تعذّر حفظ الإشعارات' })
    }
  }

  function changeLanguage(l: 'ar' | 'en') {
    if (l === 'en' && !ENGLISH_ENABLED) {
      toast({ type: 'info', message: 'النسخة الإنجليزية غير متاحة بعد', description: 'ستعمل لوحة التحكم بالإنجليزية فور إطلاقها.' })
      return
    }
    setLocale(l)
  }

  async function deleteAccount() {
    const { confirmed } = await confirm({
      title: 'حذف حسابك نهائيًا؟',
      message: 'تُحذف مواقعك وبياناتك ويُلغى اشتراكك في Stripe. لا يمكن التراجع عن هذا.',
      confirmText: 'احذف الحساب',
      tone: 'danger',
    })
    if (!confirmed) return
    const res = await fetch('/api/account/delete', { method: 'POST' })
    if (!res.ok) {
      toast({ type: 'error', message: 'تعذّر حذف الحساب' })
      return
    }
    await createClient().auth.signOut()
    router.push('/?account_deleted=1')
  }

  if (!loaded) return null

  return (
    <SettingsScreen
      name={name}
      email={email}
      onName={setName}
      onEmail={setEmail}
      save={{ onClick: save, disabled: saving }}
      saving={saving}
      saveNote={note && (
        <span role="status" className="text-[14.5px] font-medium leading-[1.7]" style={{ color: note.tone === 'ok' ? '#15803d' : '#b91c1c' }}>
          {note.text}
        </span>
      )}
      language={locale}
      onLanguage={changeLanguage}
      notifications={NOTIFICATION_PREFS.map((p) => ({
        key: p.key,
        label: p.label,
        on: prefs[p.key],
        onToggle: () => toggle(p.key),
      }))}
      deleteAccount={{ onClick: deleteAccount }}
    />
  )
}
