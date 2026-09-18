'use client'

import {
  ArrowRight, BarChart3, CalendarCheck, CheckCircle2, ExternalLink, Eye, Folder, Globe,
  Image as ImageIcon, Plus,
} from 'lucide-react'
import { Act, EmptyHint, Page, StatCard, StatGrid, type Action, type Tone } from './kit'

export type HomeSite = { id: string; name: string; host: string | null; live: boolean; open?: Action }

export type HomeScreenProps = {
  name: string
  planLabel: string
  planTone: Tone
  email: string
  stats: { sites: number; live: number; views: number; bookings: number }
  recent: HomeSite[]
  allSites?: Action
  quick: { newSite?: Action; domains?: Action; gallery?: Action; analytics?: Action }
  launch: Array<{ label: string; done: boolean }>
}

export function HomeScreen({
  name, planLabel, planTone, email, stats, recent, allSites, quick, launch,
}: HomeScreenProps) {
  return (
    <Page>
      <h2 className="zy-h1">مرحبًا بعودتك، {name}</h2>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="zy-pill" data-tone={planTone}>
          {planTone === 'ok' && <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />} {planLabel}
        </span>
        <span className="zy-sub" dir="ltr">{email}</span>
      </div>

      <div className="mt-6">
        <StatGrid>
          <StatCard label="إجمالي المواقع" value={String(stats.sites)} sub={`${stats.live} مباشر`} icon={Folder} />
          <StatCard label="مواقع مباشرة" value={String(stats.live)} sub="على zenyaai.co" icon={Globe} />
          <StatCard label="المشاهدات" value={stats.views.toLocaleString('ar')} sub="مدى الحياة" icon={Eye} />
          <StatCard label="الحجوزات" value={String(stats.bookings)} sub="هذا الشهر" icon={CalendarCheck} />
        </StatGrid>
      </div>

      {/* One column on a phone and a tablet; the aside only earns its own
          column once there is room for two real measures side by side. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:gap-6">
        <section className="min-w-0 lg:col-span-2">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 className="zy-h2">أحدث المواقع</h3>
            <Act action={allSites} className="zy-link shrink-0">
              عرض الكل ←
            </Act>
          </div>
          {recent.length === 0 ? (
            <EmptyHint>لا مواقع بعد.</EmptyHint>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl zy-card px-3 py-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="zy-tile" data-tone={s.live ? 'ok' : 'warn'}>
                      {s.live ? <Globe className="h-4 w-4" strokeWidth={2} /> : <Folder className="h-4 w-4" strokeWidth={2} />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-bold leading-[1.5] text-[#171717]">{s.name}</div>
                      <div className="truncate text-[14.5px] font-medium leading-[1.7] text-[#56565a]">
                        {s.live ? s.host : 'مسوّدة · غير منشورة بعد'}
                      </div>
                    </div>
                  </div>
                  <Act action={s.open} className="zy-btn-q shrink-0">
                    فتح <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2.25} />
                  </Act>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="zy-eyebrow">إجراءات سريعة</div>
            <div className="mt-3 space-y-1">
              {([
                { label: 'موقع جديد', icon: Plus, action: quick.newSite },
                { label: 'إدارة النطاقات', icon: Globe, action: quick.domains },
                { label: 'افتح معرضي', icon: ImageIcon, action: quick.gallery },
                { label: 'عرض التحليلات', icon: BarChart3, action: quick.analytics },
              ]).map(({ label, icon: Icon, action }) => (
                <Act key={label} action={action} className="zy-rail-row w-full justify-between">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                    <span className="truncate">{label}</span>
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 rtl-flip opacity-50" />
                </Act>
              ))}
            </div>
          </div>

          <div className="rounded-2xl zy-card p-4 sm:p-5">
            <div className="zy-eyebrow">خطة الإطلاق</div>
            <ul className="mt-3 space-y-2.5">
              {launch.map(({ label, done }) => (
                <li key={label} className="flex items-center gap-2.5 text-[14.5px] font-medium text-[#171717]">
                  <CheckCircle2
                    className={'h-4 w-4 shrink-0 ' + (done ? 'text-[#15803d]' : 'text-[rgba(17,17,17,0.18)]')}
                    strokeWidth={2.25}
                  />
                  <span className={done ? 'text-[#56565a] line-through' : ''}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Page>
  )
}
