'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, AtSign, Shield, Cookie, Download, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function DashboardSettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [supabase])

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">الإعدادات</h1>
        <p className="mt-1 text-[13px] text-muted">
          الحساب والأمان والبيانات. تظهر إعدادات ظهور المواقع المُستضافة في محرّر كل موقع.
        </p>
      </header>

      <div className="space-y-4">
        <Card title="الحساب" icon={AtSign}>
          <Row label="البريد الإلكتروني"><code className="text-[13px] text-foreground">{user?.email || '—'}</code></Row>
          <Row label="الاسم">{user?.user_metadata?.full_name || '—'}</Row>
          <Row label="معرّف المستخدم"><code className="text-[11.5px] text-muted">{user?.id || '—'}</code></Row>
        </Card>

        <Card title="الأمان" icon={Shield}>
          <Row label="كلمة المرور">
            <Link href="/login?mode=forgot" className="text-[13px] text-primary hover:underline">
              أرسل رابط إعادة التعيين إلى بريدي ←
            </Link>
          </Row>
        </Card>

        <Card title="الخصوصية وملفات الارتباط" icon={Cookie}>
          <Row label="تفضيلات ملفات الارتباط">
            <Link href="/cookies" className="text-[13px] text-primary hover:underline">إدارة ←</Link>
          </Row>
          <Row label="سياسة الخصوصية">
            <Link href="/privacy" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
              فتح <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </Row>
        </Card>

        <Card title="بياناتك" icon={Download}>
          <Row label="تصدير كل شيء">
            <a href="/api/account/export" download className="text-[13px] text-primary hover:underline">
              تنزيل JSON ←
            </a>
          </Row>
          <p className="px-3 pb-3 pt-1 text-[11.5px] leading-[1.55] text-muted">
            يشمل ملفك الشخصي وقوالبك وسجلّ الاستخراج والمشتريات. وفق المادتين 15 و20 من GDPR.
          </p>
        </Card>

        <Card title="منطقة الخطر" icon={Trash2} tint="#b91c1c">
          <Row label="حذف الحساب">
            <DeleteAccountButton />
          </Row>
          <p className="px-3 pb-3 pt-1 text-[11.5px] leading-[1.55] text-muted">
            يحذف ملفك وقوالبك وسجلّك ويسجّل خروجك.{' '}
            <strong>تُحفظ سجلّات الدفع لمدة 7 سنوات</strong> (القانون الضريبي الهولندي).
          </p>
        </Card>
      </div>
    </div>
  )
}

function Card({ title, icon: Icon, tint, children }: {
  title: string
  icon: typeof AtSign
  tint?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-token bg-white">
      <div
        className="flex items-center gap-2 border-b border-token px-4 py-2.5"
        style={tint ? { background: `${tint}08` } : undefined}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} style={{ color: tint || '#6b6b6b' }} />
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint || '#6b6b6b' }}>
          {title}
        </div>
      </div>
      <div className="divide-y divide-token">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className="text-right">{children}</div>
    </div>
  )
}

function DeleteAccountButton() {
  const [busy, setBusy] = useState(false)
  async function go() {
    const text = prompt('اكتب DELETE لتأكيد حذف الحساب نهائيًا:')
    if (text !== 'DELETE') return
    setBusy(true)
    try {
      const r = await fetch('/api/account/delete', { method: 'POST' })
      if (r.ok) {
        window.location.href = '/'
      } else {
        const j = await r.json().catch(() => ({}))
        alert(j?.details || j?.error || 'فشل الحذف.')
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      onClick={go}
      disabled={busy}
      className="rounded-md border border-[#fca5a5] bg-[#fee2e2] px-3 py-1.5 text-[12px] font-semibold text-[#b91c1c] hover:bg-[#fecaca] disabled:opacity-60"
    >
      {busy ? 'جارٍ الحذف…' : 'حذف الحساب…'}
    </button>
  )
}
