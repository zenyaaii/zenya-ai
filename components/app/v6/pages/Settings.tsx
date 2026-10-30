'use client'

/**
 * SETTINGS, as the v6 design draws it (VIEWS.settings, pwSheet, delSheet):
 * the account, security, the dashboard's look, email notices, and the
 * danger zone.
 *
 * All of it is the real account: the name and email are the auth user's,
 * the password changes in Supabase, «خروج من الكل» signs every other device
 * out, the switches are the email preferences the mailers read, and the
 * delete is the account delete.
 */

import { useEffect, useState } from 'react'
import { Ic, Seg, useV6 } from '../ui'
import { PageHead, Switch, at, byId, shake, store, useStore, type Store } from './kit'

export type V6Notice = { key: string; label: string; sub: string; on: boolean }

export type V6SettingsProps = {
  name: string
  email: string
  /** Resolves with what to tell the owner, and whether it worked. */
  saveAccount: (name: string, email: string) => Promise<{ ok: boolean; msg: string }>
  /** The account signs in with a password (not only with Google). */
  hasPassword: boolean
  /** The password row's second line: «غيّرتها قبل 3 أشهر». */
  pwNote: string
  changePassword: (current: string, next: string) => Promise<string | null>
  signOutOthers: () => Promise<boolean>
  notices: V6Notice[]
  setNotice: (key: string, on: boolean) => Promise<boolean>
  englishReady: boolean
  /** How many sites the delete takes with it. */
  sites: number
  deleteAccount: () => Promise<boolean>
}

export default function V6Settings(p: V6SettingsProps) {
  const { toast, openSheet, closeSheet, mode, setMode } = useV6()
  const [name, setName] = useState(p.name)
  const [email, setEmail] = useState(p.email)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notices, setNotices] = useState(p.notices)

  // The design's English option is there but closed until the English dashboard ships.
  useEffect(() => {
    const b = document.querySelector<HTMLButtonElement>('#lang button[data-v="en"]')
    if (b) b.disabled = !p.englishReady
  }, [p.englishReady])

  async function save() {
    const n = name.trim(), e = email.trim()
    if (!n) { shake(byId('uN')); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { shake(byId('uE')); toast('اكتب بريدًا صحيحًا', { ok: false }); return }
    setSaving(true)
    const r = await p.saveAccount(n, e)
    setSaving(false)
    if (!r.ok) { toast(r.msg, { ok: false }); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
    toast(r.msg)
  }

  function pwSheet() {
    const st = store({ busy: false, err: '' })
    openSheet({
      title: 'غيّر كلمة المرور',
      body: <PwBody st={st} current={p.hasPassword} />,
      foot: <PwFoot st={st} go={async () => {
        const cur = byId('pw0')?.value || ''
        const next = byId('pw1')?.value || ''
        if (p.hasPassword && !cur) { shake(byId('pw0')); return }
        if (next.length < 8) { shake(byId('pw1')); return }
        st.set({ busy: true, err: '' })
        const err = await p.changePassword(cur, next)
        if (err) { st.set({ busy: false, err }); return }
        closeSheet()
        toast('تم تغيير كلمة المرور')
      }} />,
    })
  }

  function delSheet() {
    const st = store({ ok: false, busy: false })
    openSheet({
      title: 'حذف الحساب نهائيًا؟',
      body: (
        <>
          <p className="t-body">تُحذف مواقعك (<span className="num">{p.sites}</span>) وكل الحجوزات والصور، ويُلغى اشتراكك في Stripe. لا يمكن التراجع عن هذا.</p>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="delIn">اكتب كلمة «احذف» للتأكيد</label>
            <input className="inp" id="delIn" autoComplete="off" autoFocus onChange={(e) => st.set({ ok: e.target.value.trim() === 'احذف' })} />
          </div>
        </>
      ),
      foot: <DelFoot st={st} go={async () => {
        st.set({ busy: true })
        if (!(await p.deleteAccount())) { st.set({ busy: false }); toast('تعذّر حذف الحساب. حاول مرة أخرى.', { ok: false }) }
      }} />,
    })
  }

  return (
    <>
      <PageHead title="الإعدادات" sub="حسابك، ومظهر اللوحة، وما تريد أن تصلك عنه رسائل." />
      <div className="set">
        <div className="stack">
          <section className="card rv" style={at(2)}>
            <h2 className="t-h3">الحساب</h2>
            <div className="stack" style={{ marginTop: 16 }}>
              <div className="field"><label htmlFor="uN">الاسم</label><input className="inp" id="uN" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /><span className="hint">يظهر في لوحة التحكم وفي رسائل البريد.</span></div>
              <div className="field"><label htmlFor="uE">البريد الإلكتروني</label><input className="inp ltr" id="uE" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={{ textAlign: 'right' }} /><span className="hint">لتسجيل الدخول والإشعارات.</span></div>
            </div>
            <div className="row-wrap" style={{ marginTop: 20 }}>
              <button className="btn k press" onClick={save} disabled={saving}>{saving ? 'نحفظ…' : 'احفظ'}</button>
              <span className={`saved${saved ? ' on' : ''}`}><Ic n="check" />تم الحفظ</span>
            </div>
          </section>
          <section className="card rv" style={at(3)}>
            <h2 className="t-h3">الأمان</h2>
            <div className="rows" style={{ marginTop: 8 }}>
              <button className="r" onClick={pwSheet}><span className="tile"><Ic n="lock" /></span><span className="tx"><b>كلمة المرور</b><span>{p.pwNote}</span></span><Ic n="chev" className="chev" /></button>
              <div className="r">
                <span className="tile"><Ic n="mobile" /></span>
                <span className="tx"><b>الأجهزة المتصلة</b><span>هذا الجهاز، وأي جهاز آخر دخلت منه</span></span>
                <button className="btn sm line press" onClick={async () => {
                  if (await p.signOutOthers()) toast('خرجنا من كل الأجهزة الأخرى')
                  else toast('تعذّر ذلك الآن. حاول مرة أخرى.', { ok: false })
                }}>خروج من الكل</button>
              </div>
            </div>
          </section>
        </div>
        <div className="stack">
          <section className="card rv" style={at(4)}>
            <h2 className="t-h3">المظهر</h2>
            <div className="theme-pick" style={{ marginTop: 14 }} role="group" aria-label="المظهر">
              {([['light', 'فاتح', 'l'], ['dark', 'داكن', 'd'], ['auto', 'تلقائي', 'a']] as const).map(([v, t, c]) => (
                <button key={v} type="button" data-v={v} aria-pressed={v === mode} onClick={() => setMode(v)}>
                  <span className={`sw-prev ${c}`}><i /><i /></span>{t}
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 18 }}>
              <span className="lab">اللغة</span>
              <Seg<'ar' | 'en'> id="lang" items={[['ar', 'العربية'], ['en', 'English']]} value="ar" onChange={() => {}} label="لغة اللوحة" />
              <span className="hint">النسخة الإنجليزية قريبًا.</span>
            </div>
          </section>
          <section className="card rv" style={at(5)}>
            <h2 className="t-h3">الإشعارات بالبريد</h2>
            <div className="rows" style={{ marginTop: 8 }}>
              {notices.map((n) => (
                <div key={n.key} className="r">
                  <span className="tx"><b>{n.label}</b><span>{n.sub}</span></span>
                  <span className="end">
                    <Switch on={n.on} label={n.label} onChange={async (on) => {
                      setNotices((l) => l.map((x) => (x.key === n.key ? { ...x, on } : x)))
                      if (await p.setNotice(n.key, on)) toast(on ? 'سنرسل لك: ' + n.label : 'أوقفنا رسائل: ' + n.label)
                      else { setNotices((l) => l.map((x) => (x.key === n.key ? { ...x, on: !on } : x))); toast('تعذّر حفظ الإشعارات', { ok: false }) }
                    }} />
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="card danger-zone rv" style={at(6)}>
            <h2 className="t-h3" style={{ color: 'var(--bad)' }}>منطقة الخطر</h2>
            <p className="t-small" style={{ marginTop: 4 }}>حذف الحساب يزيل كل مواقعك وبياناتك، ويلغي اشتراكك. لا يمكن التراجع عنه.</p>
            <button className="btn danger press" style={{ marginTop: 14 }} onClick={delSheet}><Ic n="trash" />احذف الحساب</button>
          </section>
        </div>
      </div>
    </>
  )
}

function PwBody({ st, current }: { st: Store<{ busy: boolean; err: string }>; current: boolean }) {
  const s = useStore(st)
  return (
    <div className="stack">
      {current && <div className="field"><label htmlFor="pw0">كلمة المرور الحالية</label><input className="inp" id="pw0" type="password" autoComplete="current-password" autoFocus /></div>}
      <div className="field">
        <label htmlFor="pw1">كلمة المرور الجديدة</label>
        <input className="inp" id="pw1" type="password" autoComplete="new-password" autoFocus={!current} />
        <span className="hint" id="pwHint" style={s.err ? { color: 'var(--bad)' } : undefined}>{s.err || '8 أحرف على الأقل.'}</span>
      </div>
    </div>
  )
}

function PwFoot({ st, go }: { st: Store<{ busy: boolean; err: string }>; go: () => void }) {
  const s = useStore(st)
  const { closeSheet } = useV6()
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
      <button className="btn k press" onClick={go} disabled={s.busy}>{s.busy ? 'نغيّرها…' : 'غيّرها'}</button>
    </>
  )
}

function DelFoot({ st, go }: { st: Store<{ ok: boolean; busy: boolean }>; go: () => void }) {
  const s = useStore(st)
  const { closeSheet } = useV6()
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
      <button className="btn danger solid press" disabled={!s.ok || s.busy} onClick={go}>{s.busy ? 'نحذف…' : 'احذف الحساب'}</button>
    </>
  )
}
