'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'starter' | 'pro' | 'admin'

type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
  hosting_status: string | null
  hosting_current_period_end: string | null
  pro_purchased_at: string | null
  pro_amount_cents: number | null
  pro_currency: string | null
  email?: string | null
}

export default function BillingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalBusy, setPortalBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting, hosting_status, hosting_current_period_end, pro_purchased_at, pro_amount_cents, pro_currency, email')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setProfile((data as unknown as Profile) || null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  async function openPortal() {
    setPortalBusy(true)
    try {
      const r = await fetch('/api/account/portal', { method: 'POST' })
      if (r.ok) {
        const { url } = await r.json()
        if (url) window.location.href = url
      }
    } finally { setPortalBusy(false) }
  }

  const plan: Plan = profile?.plan || 'free'
  const renews = profile?.hosting_current_period_end ? new Date(profile.hosting_current_period_end) : null
  const purchased = profile?.pro_purchased_at ? new Date(profile.pro_purchased_at) : null

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* The head every screen in app/demo/dashboard uses: an icon chip, the
          title, and one sentence saying what the screen is for. The rule
          underneath it goes — a border-b under a heading is a second
          separator on a surface whose cards already separate themselves. */}
      <header className="mb-6 flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--field)', color: 'var(--stone)' }}
        >
          <CreditCard className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          {/* was negative tracking on Arabic, whose letterforms
              connect. */}
          <h1 className="zy-h1">الفوترة</h1>
          <p className="zy-sub mt-1">
            باقتك، وسجلّ الدفع، وبوابة عملاء Stripe — الفواتير وطرق الدفع المحفوظة.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl zy-card p-6">
              <div className="h-4 w-1/3 rounded bg-[rgba(28,28,28,0.06)]" />
              <div className="mt-3 h-3 w-1/2 rounded bg-[rgba(28,28,28,0.04)]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Current plan card */}
          <section className="rounded-2xl zy-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {plan === 'pro_hosting' && <PlanHeader icon="✓" tint="#15803d" label="الاستضافة نشطة (خطة سابقة)" />}
                {plan === 'pro_onetime' && <PlanHeader icon="★" tint="#5e6ad2" label="برو · مدى الحياة (خطة سابقة)" />}
                {plan === 'starter' && <PlanHeader icon="★" tint="#5e6ad2" label="Starter · نشط" />}
                {plan === 'pro' && <PlanHeader icon="✓" tint="#15803d" label="Pro · نشط" />}
                {plan === 'admin' && <PlanHeader icon="★" tint="#9b6f00" label="مشرف · كل المزايا" />}
                {plan === 'free' && <PlanHeader icon=" " tint="#6b6b6b" label="الباقة المجانية" />}

                <div className="mt-2 text-[26px] font-bold text-foreground">
                  {plan === 'pro_hosting' && '19.99$ / شهريًا'}
                  {plan === 'pro_onetime' && '9.99$ دُفعت مرة واحدة'}
                  {plan === 'starter' && '14.99$ / شهريًا'}
                  {plan === 'pro' && '24.99$ / شهريًا'}
                  {plan === 'admin' && 'بلا رسوم'}
                  {plan === 'free' && '$0'}
                </div>

                <div className="mt-1 text-[14.5px] text-muted">
                  {(plan === 'pro_hosting' || plan === 'starter' || plan === 'pro') && renews && <>يتجدّد {renews.toLocaleDateString(undefined, { dateStyle: 'medium' })}</>}
                  {plan === 'pro_onetime' && purchased && <>وصول مدى الحياة · تم الشراء {purchased.toLocaleDateString(undefined, { dateStyle: 'medium' })}</>}
                  {plan === 'free' && 'توليدان مجانيان عند التسجيل. بلا اشتراك.'}
                  {plan === 'admin' && 'حساب فريق داخلي'}
                </div>
              </div>

              {/* Plan actions */}
              <div className="flex flex-col gap-2">
                {plan === 'free' && (
                  <>
                    <Link href="/pricing?upgrade=starter"
                          className="zy-btn">
                      اشترك في Starter · 14.99$/شهريًا
                      <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
                    </Link>
                    <Link href="/pricing?upgrade=pro"
                          className="zy-btn-q">
                      اشترك في Pro · 24.99$ شهريًا
                    </Link>
                  </>
                )}
                {plan === 'pro_onetime' && (
                  <Link href="/pricing?upgrade=pro"
                        className="zy-btn">
                    أضف الاستضافة · 19.99$ شهريًا
                    <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
                  </Link>
                )}
                {plan === 'starter' && (
                  <>
                    <Link href="/pricing?upgrade=pro"
                          className="zy-btn">
                      الترقية إلى Pro · 24.99$ شهريًا
                      <ArrowRight className="h-3 w-3 rtl-flip" strokeWidth={2.5} />
                    </Link>
                    <button onClick={openPortal} disabled={portalBusy}
                            className="zy-btn-q">
                      <CreditCard className="h-3 w-3" />
                      {portalBusy ? 'جارٍ الفتح…' : 'إدارة الاشتراك'}
                    </button>
                  </>
                )}
                {(plan === 'pro_hosting' || plan === 'pro') && (
                  <button onClick={openPortal} disabled={portalBusy}
                          className="zy-btn-q">
                    <CreditCard className="h-3 w-3" />
                    {portalBusy ? 'جارٍ الفتح…' : 'إدارة الاشتراك'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Removed the standalone "افتح بوابة Stripe" section — the small
              "إدارة الاشتراك" button in the plan card above already covers
              subscription management for paying users. Keeping two entry
              points to the same portal was noisy and made billing feel
              third-party rather than part of Zenya. */}

          {/* What's included */}
          <section className="mt-4 rounded-2xl zy-card p-6">
            <h2 className="zy-h3">ما هو مشمول</h2>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              <Included on={true}                  label="مجاني · موقعان بالذكاء الاصطناعي" />
              <Included on={plan !== 'free'}       label="برو · توليد غير محدود" />
              <Included on={plan !== 'free'}       label="برو · تصدير ثيم شوبيفاي جاهز" />
              <Included on={plan !== 'free'}       label="برو · ملفات المشاريع للقوالب غير الشوبيفاي" />
              <Included on={plan === 'pro_hosting' || plan === 'pro' || plan === 'admin'} label="استضافة · مباشر على الاسم.zenyaai.co" />
              <Included on={plan === 'pro_hosting' || plan === 'pro' || plan === 'admin'} label="استضافة · نطاق مخصّص + SSL تلقائي" />
              <Included on={plan === 'pro_hosting' || plan === 'pro' || plan === 'admin'} label="استضافة · تعديل المحتوى والتصميم دون إعادة التوليد" />
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function PlanHeader({ icon, tint, label }: { icon: string; tint: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[14.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint }}>
      {icon !== ' ' && (icon === '✓' ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />)}
      {label}
    </div>
  )
}

function Included({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-foreground">
      <span className={'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ' + (on ? 'bg-[#15803d]/15 text-[#15803d]' : 'bg-[rgba(28,28,28,0.06)] text-muted')}>
        {on ? '✓' : '·'}
      </span>
      <span className={on ? 'text-foreground' : 'text-muted line-through'}>{label}</span>
    </li>
  )
}
