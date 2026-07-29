'use client'

import Link from 'next/link'
import {
  BarChart3, ExternalLink, Folder, Globe, Lightbulb, MousePointerClick,
  Smartphone, Monitor, Tablet, HelpCircle, TriangleAlert, CircleCheck, Info,
} from 'lucide-react'
import {
  CHANNEL_LABEL_AR, EVENT_LABEL_AR, countryFlag, countryNameAr, deviceLabelAr,
  formatDuration, isEventType, type Channel,
} from '@/lib/analytics-core'
import { publicSiteHost, publicSiteUrl } from '@/lib/portal-urls'
import Heatmap from './Heatmap'
import {
  BarList, EmptyState, Note, Panel, PanelWithTitle, Section, TableWrap, Td, Th,
} from './primitives'
import type { AnalyticsPayload } from './types'

/* ─── Overview ────────────────────────────────────────────────────────────── */

export function OverviewPanel({ d }: { d: AnalyticsPayload }) {
  if (d.sites.length === 0) {
    return (
      <Section title="ابدأ من هنا">
        <EmptyState
          icon={Folder}
          title="لا مواقع بعد"
          body="أنشئ موقعك الأول وانشره على زينيا — وسنبدأ فورًا بتتبّع الزيارات ومصادرها ونقرات التواصل هنا."
          cta={{ href: '/theme/new', label: 'أنشئ موقعك الأول' }}
        />
      </Section>
    )
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="أهم الصفحات" hint="أين يقضي الزوّار وقتهم">
            <PanelWithTitle title="الصفحات" hint={`${d.pages.length} صفحة`}>
              {d.pages.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12.5px] text-muted">لا بيانات بعد</div>
              ) : (
                <BarList
                  rows={d.pages.map((p) => ({
                    name: p.path, views: p.views, sessions: 0, visitors: p.visitors,
                  }))}
                  max={8}
                  renderName={(r) => (r.name === '/' ? 'الصفحة الرئيسية' : r.name)}
                />
              )}
            </PanelWithTitle>
          </Section>
        </div>
        <div>
          <Section title="من أين يأتون" hint="آخر مدة محددة">
            <PanelWithTitle title="القنوات">
              <BarList
                rows={d.channels}
                renderName={(r) => CHANNEL_LABEL_AR[r.name as Channel] || r.name}
                emptyLabel="لا بيانات بعد"
              />
            </PanelWithTitle>
          </Section>
        </div>
      </div>

      <SitesTable d={d} />
      {d.per_template.length > 1 && <TemplatesTable d={d} />}
    </>
  )
}

function SitesTable({ d }: { d: AnalyticsPayload }) {
  return (
    <Section
      title="تفصيل حسب الموقع"
      action={
        <Link href="/dashboard/sites" className="text-[12px] font-medium text-primary hover:underline">
          إدارة المواقع ←
        </Link>
      }
    >
      <TableWrap>
        <thead className="bg-[#fafaf7]">
          <tr>
            <Th>الموقع</Th>
            <Th align="end">المشاهدات</Th>
            <Th align="end">الزوّار</Th>
            <Th align="end">الإجمالي الكلي</Th>
            <Th align="end">الحالة</Th>
          </tr>
        </thead>
        <tbody>
          {d.per_site.map((s) => (
            <tr key={s.id} className="border-t border-token">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(94,106,210,0.10)]">
                    <Folder className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{s.product_name}</div>
                    <div className="truncate text-[11.5px] text-muted">
                      {s.is_published && s.slug ? publicSiteHost(s.slug) : `${s.template} · مسودة`}
                    </div>
                  </div>
                </div>
              </Td>
              <Td align="end" className="text-foreground">{s.views.toLocaleString('ar')}</Td>
              <Td align="end" className="text-muted">{s.visitors.toLocaleString('ar')}</Td>
              <Td align="end" className="text-muted">{s.lifetime_views.toLocaleString('ar')}</Td>
              <Td align="end">
                {s.is_published && s.slug ? (
                  <a
                    href={publicSiteUrl(s.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-[rgba(21,128,61,0.10)] px-2 py-0.5 text-[10.5px] font-semibold text-[#15803d]"
                  >
                    منشور <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <span className="inline-flex rounded-full bg-[rgba(217,119,6,0.10)] px-2 py-0.5 text-[10.5px] font-semibold text-[#b45309]">
                    مسودة
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Section>
  )
}

function TemplatesTable({ d }: { d: AnalyticsPayload }) {
  const max = Math.max(1, ...d.per_template.map((p) => p.views))
  return (
    <Section title="حسب القالب" hint="أي قالب يجذب الزوّار">
      <TableWrap>
        <thead className="bg-[#fafaf7]">
          <tr>
            <Th>القالب</Th>
            <Th align="end">منشور · الإجمالي</Th>
            <Th align="end">المشاهدات</Th>
            <Th align="end">الزوّار</Th>
          </tr>
        </thead>
        <tbody>
          {d.per_template.map((p) => (
            <tr key={p.template} className="border-t border-token">
              <Td>
                <div className="font-medium capitalize text-foreground">{p.template}</div>
                <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(p.views / max) * 100}%` }} />
                </div>
              </Td>
              <Td align="end" className="text-muted">{p.published} · {p.sites}</Td>
              <Td align="end" className="text-foreground">{p.views.toLocaleString('ar')}</Td>
              <Td align="end" className="text-muted">{p.visitors.toLocaleString('ar')}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Section>
  )
}

/* ─── Audience ────────────────────────────────────────────────────────────── */

export function AudiencePanel({ d }: { d: AnalyticsPayload }) {
  return (
    <>
      <Section title="متى يزورك عملاؤك" hint="حسب توقيتك المحلي">
        <Panel className="overflow-hidden">
          <Heatmap cells={d.hourly} tzLabel={d.tz} />
        </Panel>
        <Note>
          كل مربّع = ساعة واحدة من أيام الأسبوع، واللون الأغمق يعني زيارات أكثر. انشر عروضك قبل ساعة الذروة بقليل.
        </Note>
      </Section>

      <Section title="من هم الزوّار">
        <div className="grid gap-5 lg:grid-cols-3">
          <PanelWithTitle title="الدول" hint={`${d.countries.length}`}>
            <BarList
              rows={d.countries}
              renderName={(r) => (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>{countryFlag(r.name)}</span>
                  {countryNameAr(r.name)}
                </span>
              )}
            />
          </PanelWithTitle>
          <PanelWithTitle title="الأجهزة">
            <BarList
              rows={d.devices}
              renderName={(r) => (
                <span className="inline-flex items-center gap-1.5">
                  <DeviceIcon device={r.name} />
                  {deviceLabelAr(r.name)}
                </span>
              )}
            />
          </PanelWithTitle>
          <div className="space-y-5">
            <PanelWithTitle title="المتصفحات">
              <BarList rows={d.browsers} max={6} />
            </PanelWithTitle>
            <PanelWithTitle title="أنظمة التشغيل">
              <BarList rows={d.operating_systems} max={6} />
            </PanelWithTitle>
          </div>
        </div>
      </Section>
    </>
  )
}

export function DeviceIcon({ device }: { device: string }) {
  const cls = 'h-3.5 w-3.5 text-muted'
  if (device === 'Mobile') return <Smartphone className={cls} strokeWidth={2} />
  if (device === 'Tablet') return <Tablet className={cls} strokeWidth={2} />
  if (device === 'Desktop') return <Monitor className={cls} strokeWidth={2} />
  return <HelpCircle className={cls} strokeWidth={2} />
}

/* ─── Sources ─────────────────────────────────────────────────────────────── */

export function SourcesPanel({ d }: { d: AnalyticsPayload }) {
  const noReferrers = d.referrers.every((r) => r.name === 'unknown')
  return (
    <>
      <Section title="مصادر الزيارات">
        <div className="grid gap-5 lg:grid-cols-2">
          <PanelWithTitle title="القنوات" hint="كيف وصلوا">
            <BarList
              rows={d.channels}
              renderName={(r) => CHANNEL_LABEL_AR[r.name as Channel] || r.name}
            />
          </PanelWithTitle>
          <PanelWithTitle title="المواقع المُحيلة" hint="من أين نقروا">
            <BarList
              rows={d.referrers.filter((r) => r.name !== 'unknown')}
              emptyLabel="لا توجد إحالات مسجّلة بعد"
            />
          </PanelWithTitle>
        </div>
        {noReferrers && (
          <Note>
            الزيارات المباشرة تُسجَّل عندما لا يرسل المتصفح موقع المصدر — وهذا طبيعي في الروابط
            المُرسَلة عبر واتساب أو من داخل تطبيقات التواصل.
          </Note>
        )}
      </Section>

      <Section title="الحملات" hint="روابط تحمل وسوم UTM">
        <div className="grid gap-5 lg:grid-cols-2">
          <PanelWithTitle title="اسم الحملة">
            <BarList rows={d.campaigns} emptyLabel="لا توجد حملات موسومة" />
          </PanelWithTitle>
          <PanelWithTitle title="مصدر الحملة">
            <BarList rows={d.utm_sources} emptyLabel="لا توجد مصادر موسومة" />
          </PanelWithTitle>
        </div>
        <Note>
          لقياس إعلان أو منشور بعينه، أضف <code className="rounded bg-black/[0.05] px-1">?utm_source=instagram&amp;utm_campaign=summer</code> إلى نهاية الرابط الذي تشاركه.
        </Note>
      </Section>
    </>
  )
}

/* ─── Content ─────────────────────────────────────────────────────────────── */

export function ContentPanel({ d }: { d: AnalyticsPayload }) {
  if (d.pages.length === 0) {
    return (
      <Section title="الصفحات">
        <EmptyState
          icon={BarChart3}
          title="لا توجد بيانات صفحات بعد"
          body="ما إن يزور أحدهم موقعك المنشور، سنعرض هنا أي صفحة زارها، وكم بقي فيها، وإلى أي مدى مرّر لأسفل."
        />
      </Section>
    )
  }
  return (
    <Section title="أداء الصفحات" hint="مرتبة حسب المشاهدات">
      <TableWrap>
        <thead className="bg-[#fafaf7]">
          <tr>
            <Th>الصفحة</Th>
            <Th align="end">المشاهدات</Th>
            <Th align="end">الزوّار</Th>
            <Th align="end">متوسط المدة</Th>
            <Th align="end">عمق التمرير</Th>
          </tr>
        </thead>
        <tbody>
          {d.pages.map((p) => (
            <tr key={p.path} className="border-t border-token">
              <Td>
                <span className="font-medium text-foreground">
                  {p.path === '/' ? 'الصفحة الرئيسية' : p.path}
                </span>
              </Td>
              <Td align="end" className="text-foreground">{p.views.toLocaleString('ar')}</Td>
              <Td align="end" className="text-muted">{p.visitors.toLocaleString('ar')}</Td>
              <Td align="end" className="text-muted">
                {p.avg_engaged_ms == null ? '—' : formatDuration(p.avg_engaged_ms)}
              </Td>
              <Td align="end">
                {p.avg_scroll_pct == null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, p.avg_scroll_pct)}%` }}
                      />
                    </span>
                    <span className="tabular-nums text-muted">{Math.round(p.avg_scroll_pct)}%</span>
                  </span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Note>
        المدة وعمق التمرير يُقاسان فقط للزوّار الذين يعمل لديهم جافاسكربت، لذا قد يقلّ عددهم عن
        إجمالي المشاهدات. تظهر «—» عندما لا توجد قياسات كافية بدلًا من عرض صفر مضلِّل.
      </Note>
    </Section>
  )
}

/* ─── Conversions ─────────────────────────────────────────────────────────── */

export function ConversionsPanel({ d }: { d: AnalyticsPayload }) {
  const c = d.conversions
  if (c.total === 0) {
    return (
      <Section title="التحويلات">
        <EmptyState
          icon={MousePointerClick}
          title="لا توجد إجراءات تواصل مسجّلة"
          body={
            d.totals.sessions > 0
              ? 'لدى موقعك زيارات، لكن لم ينقر أحد على واتساب أو الهاتف أو زر الحجز بعد. تأكّد أن أزرار التواصل ظاهرة في أعلى الصفحة وواضحة على الجوال.'
              : 'سنسجّل هنا كل نقرة على واتساب أو الهاتف أو البريد أو زر الحجز أو الخريطة — تلقائيًا، دون أي إعداد منك.'
          }
        />
        <Note>
          نرصد تلقائيًا روابط <code className="rounded bg-black/[0.05] px-1">wa.me</code> و
          <code className="mx-1 rounded bg-black/[0.05] px-1">tel:</code> و
          <code className="rounded bg-black/[0.05] px-1">mailto:</code> وخرائط جوجل وأزرار الحجز في كل قوالبك.
        </Note>
      </Section>
    )
  }

  const max = Math.max(1, ...c.by_type.map((r) => r.events))
  return (
    <>
      <Section title="إجراءات التواصل" hint={`معدل التحويل ${c.rate}% من الجلسات`}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel className="overflow-hidden">
            <div className="border-b border-token px-4 py-2.5">
              <h3 className="text-[13px] font-semibold text-foreground">حسب نوع الإجراء</h3>
            </div>
            <ul className="divide-y divide-[color:var(--border)]">
              {c.by_type.map((r) => (
                <li key={r.event_type} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-medium text-foreground">
                      {isEventType(r.event_type) ? EVENT_LABEL_AR[r.event_type] : r.event_type}
                    </span>
                    <span className="shrink-0 text-[12.5px] tabular-nums text-foreground">
                      {r.events.toLocaleString('ar')}
                      <span className="ms-1.5 text-[11px] text-muted">
                        {r.sessions.toLocaleString('ar')} جلسة
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
                    <div
                      className="h-full rounded-full bg-[#15803d]"
                      style={{ width: `${(r.events / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <PanelWithTitle title="أفضل الصفحات تحويلًا" hint="أين ينقرون">
            <BarList
              rows={c.by_path.map((p) => ({
                name: p.path, views: p.events, sessions: 0, visitors: 0,
              }))}
              renderName={(r) => (r.name === '/' ? 'الصفحة الرئيسية' : r.name)}
              emptyLabel="لا بيانات بعد"
            />
          </PanelWithTitle>
        </div>
      </Section>

      <Section title="ماذا يعني هذا">
        <Panel className="p-5">
          <p className="text-[13px] leading-relaxed text-foreground">
            من كل <b>{d.totals.sessions.toLocaleString('ar')}</b> جلسة على موقعك، قام{' '}
            <b>{c.total.toLocaleString('ar')}</b> زائر بإجراء تواصل فعلي — أي{' '}
            <b>{c.rate}%</b>. هذا هو الرقم الذي يقيس ما إذا كان موقعك يجلب لك عملاء، لا مجرد زيارات.
          </p>
        </Panel>
      </Section>
    </>
  )
}

/* ─── Insights ────────────────────────────────────────────────────────────── */

export function InsightsPanel({ d }: { d: AnalyticsPayload }) {
  if (d.insights.length === 0) {
    return (
      <Section title="رؤى">
        <EmptyState
          icon={Lightbulb}
          title="لا توجد ملاحظات بعد"
          body="نعرض هنا ملاحظات مستخرجة من أرقامك أنت فقط. عند توفّر بيانات كافية ستظهر تلقائيًا."
        />
      </Section>
    )
  }
  return (
    <Section title="رؤى" hint="مستخرجة من أرقامك أنت">
      <div className="grid gap-4 sm:grid-cols-2">
        {d.insights.map((ins, i) => {
          const Icon = ins.tone === 'good' ? CircleCheck : ins.tone === 'warn' ? TriangleAlert : Info
          const color = ins.tone === 'good' ? '#15803d' : ins.tone === 'warn' ? '#b45309' : '#5e6ad2'
          return (
            <Panel key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${color}1a` }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13.5px] font-semibold text-foreground">{ins.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{ins.body}</p>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>
      <Note>
        كل ملاحظة هنا مبنية على بياناتك الفعلية في المدة المحددة — لا توجد تقديرات ولا متوسطات
        سوق. إن لم تكن البيانات كافية لقول شيء صحيح، لا نقول شيئًا.
      </Note>
    </Section>
  )
}

/* ─── shared tiny bits ────────────────────────────────────────────────────── */

export function GlobeIcon() {
  return <Globe className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
}
