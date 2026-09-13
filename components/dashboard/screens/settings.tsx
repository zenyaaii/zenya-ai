'use client'

import type { ReactNode } from 'react'
import { Settings, Trash2 } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import { Act, Page, PageHead, type Action } from './kit'

export type NotificationData = { key: string; label: string; on: boolean; onToggle?: () => void }

export type SettingsScreenProps = {
  name: string
  email: string
  onName?: (v: string) => void
  onEmail?: (v: string) => void
  save?: Action
  saving?: boolean
  saveNote?: ReactNode
  language: 'ar' | 'en'
  onLanguage?: (l: 'ar' | 'en') => void
  notifications: NotificationData[]
  deleteAccount?: Action
}

export function SettingsScreen({
  name, email, onName, onEmail, save, saving = false, saveNote, language, onLanguage, notifications, deleteAccount,
}: SettingsScreenProps) {
  return (
    <Page>
      <PageHead title="الإعدادات" sub="حسابك، ولغتك، وما تريد أن تصلك عنه رسائل." icon={Settings} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5">
          <h3 className="zy-h3">الحساب</h3>
          <div className="mt-4 space-y-4">
            <Field label="الاسم" value={name} onChange={onName} hint="يظهر في لوحة التحكم وفي رسائل البريد." />
            <Field label="البريد الإلكتروني" value={email} onChange={onEmail} ltr hint="لتسجيل الدخول والإشعارات." />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Act action={save} className="zy-btn">{saving ? 'جارٍ الحفظ…' : 'احفظ'}</Act>
            {saveNote}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">اللغة</h3>
            <p className="zy-sub mt-1.5">لوحة التحكم تعمل بالعربية والإنجليزية.</p>
            <div className="mt-3.5">
              <Segmented
                label="لغة اللوحة"
                value={language}
                onChange={(l) => onLanguage?.(l)}
                items={[{ key: 'ar', label: 'العربية' }, { key: 'en', label: 'English' }]}
              />
            </div>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">الإشعارات</h3>
            <ul className="mt-3 space-y-3">
              {notifications.map((n) => (
                <li key={n.key} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[14.5px] font-medium text-[#171717]">{n.label}</span>
                  {n.onToggle ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={n.on}
                      aria-label={n.label}
                      onClick={n.onToggle}
                      className="inline-flex min-h-[38px] shrink-0 items-center"
                    >
                      <span className="zy-switch" data-on={n.on ? '' : undefined}>
                        <span className="zy-switch-knob" />
                      </span>
                    </button>
                  ) : (
                    <span className="zy-switch shrink-0" data-on={n.on ? '' : undefined} aria-hidden>
                      <span className="zy-switch-knob" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <h3 className="zy-h3">منطقة الخطر</h3>
            <p className="zy-sub mt-1.5">حذف الحساب يزيل كل مواقعك ولا يمكن التراجع عنه.</p>
            <Act action={deleteAccount} className="zy-btn-q mt-3.5" style={{ color: '#b91c1c' }}>
              <Trash2 className="h-3 w-3" strokeWidth={2.25} />احذف الحساب
            </Act>
          </div>
        </div>
      </div>
    </Page>
  )
}

function Field({
  label, value, hint, onChange, ltr,
}: { label: string; value: string; hint: string; onChange?: (v: string) => void; ltr?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[14.5px] font-bold text-[#171717]">{label}</label>
      <input
        readOnly={!onChange}
        value={value}
        dir={ltr ? 'ltr' : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2.5 text-[14.5px] font-medium"
      />
      <p className="mt-1.5 text-[14.5px] font-medium leading-[1.7] text-[#66666e]">{hint}</p>
    </div>
  )
}
