'use client'

/**
 * The demo dashboard's pages: the v6 pages themselves (components/app/v6/
 * pages), the same components app/(app)/dashboard/** renders for a
 * signed-in owner, handed sample data instead of a live account.
 *
 * Every action works on the sample for this visit only: a booking confirms,
 * a review hides, a picture is deleted, and nothing reaches a server. The
 * few that would leave the page (Stripe, Google, a registrar) say so in a
 * toast instead.
 */

import { useMemo, useState } from 'react'
import V6Sites, { type V6Hours, type V6SiteRow } from '@/components/app/v6/pages/Sites'
import V6Gallery, { type V6Asset } from '@/components/app/v6/pages/Gallery'
import V6Bookings, { type V6Booking } from '@/components/app/v6/pages/Bookings'
import V6Reviews, { type V6Review } from '@/components/app/v6/pages/Reviews'
import V6Seo from '@/components/app/v6/pages/Seo'
import V6Domains, { type V6Domain } from '@/components/app/v6/pages/Domains'
import V6Billing, { V6_PLANS } from '@/components/app/v6/pages/Billing'
import V6Settings from '@/components/app/v6/pages/Settings'
import { useV6 } from '@/components/app/v6/ui'
import { GSC_EMAIL, INVOICES, SEO_SITE, SITES } from './data'

type Go = (to: string) => void
const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms))

/* The fixture sites carry a label, not a template id. */
const KIND: Record<string, string> = {
  'مطعم': 'restaurant', 'تطبيق': 'atlas', 'عافية': 'wellness', 'أزياء': 'lookbook', 'شوبيفاي': 'collective',
}
const SLUG: Record<string, string> = { s4: 'lookbook26', s5: 'alkhait' }

export function SitesView({ siteId, setSiteId, go }: { siteId: string; setSiteId: (id: string) => void; go: Go }) {
  const [pub, setPub] = useState<Record<string, string>>({})
  const to = (v: string) => ({ onSelect: () => go(v) })
  const [sw, setSw] = useState<Record<string, V6SiteRow['sw']>>({})
  const [hours, setHours] = useState<V6Hours[]>(() => ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((d, i) => ({ d, on: i !== 3, from: '12:00', to: '00:00' })))
  const rows: V6SiteRow[] = SITES.map((s) => {
    const k = KIND[s.kind]
    const host = s.id === 's1' ? 'almadina.ae' : s.id === 's2' ? 'atlasstudio.app' : s.host || (pub[s.id] ? `${pub[s.id]}.beynoun.com` : null)
    return {
      id: s.id, name: s.name, kind: s.kind, live: !!host, host,
      url: host ? `https://${host}` : null,
      updated: s.updated,
      cover: k ? `/theme-previews/phone/${k}.webp` : null,
      edit: { href: '/demo/editor' },
      preview: {},
      shopify: k === 'collective' ? {} : undefined,
      photos: k === 'restaurant' ? 9 : k === 'collective' ? 0 : 4,
      menu: k === 'restaurant' ? { dishes: 34, cats: 5 } : null,
      hours: k === 'restaurant' ? hours : null,
      sw: sw[s.id] || (k === 'collective' ? { bookings: null, wa: null, reviews: null } : { bookings: k !== 'wellness' ? true : null, wa: k === 'restaurant' || k === 'wellness' ? k === 'restaurant' : null, reviews: true }),
      slugHint: SLUG[s.id] || (s.host || '').split('.')[0],
    }
  })
  return (
    <V6Sites
      sites={rows}
      current={siteId}
      onPick={setSiteId}
      canPublish
      suffix=".beynoun.com"
      links={{ newSite: {}, gallery: to('gallery'), domains: to('domains') }}
      checkSlug={async (slug) => { await wait(300); return ['al-madina', 'waha', 'test', 'admin', 'www'].includes(slug) ? 'هذا الاسم مأخوذ، جرّب اسمًا آخر' : true }}
      publish={async (_id, slug) => { await wait(900); return { ok: true, slug, url: `https://${slug}.beynoun.com` } }}
      onPublished={(id, slug) => setPub((x) => ({ ...x, [id]: slug }))}
      setSwitch={async (id, key, on) => {
        const row = rows.find((r) => r.id === id)
        if (!row) return 'تعذّر الحفظ'
        setSw((x) => ({ ...x, [id]: { ...row.sw, [key]: on } }))
        return null
      }}
      saveHours={async (_id, h) => { await wait(400); setHours(h); return true }}
    />
  )
}

const PICS: [string, string, number][] = [
  ['/theme-previews/phone/restaurant.webp', 's1', 412], ['/theme-previews/thumb/restaurant.webp', 's1', 288],
  ['/theme-previews/phone/wellness.webp', 's3', 374], ['/theme-previews/thumb/wellness.webp', 's3', 221],
  ['/theme-previews/phone/atlas.webp', 's2', 164], ['/theme-previews/phone/lookbook.webp', 's4', 598],
  ['/theme-previews/thumb/lookbook.webp', 's4', 333], ['/theme-previews/phone/studio.webp', '', 506],
  ['/theme-previews/thumb/services.webp', 's1', 190],
]
const PIC_NAMES = ['واجهة المطعم.webp', 'طبق اليوم.webp', 'غرفة العلاج.webp', 'زيوت عطرية.webp', 'شاشة التطبيق.webp', 'إطلالة الخريف.webp', 'تفاصيل القماش.webp', 'الاستوديو.webp', 'فريق العمل.webp']

export function GalleryView() {
  const [assets, setAssets] = useState<V6Asset[]>(() => PICS.map(([url, site, k], i) => ({
    id: 'a' + i, url, name: PIC_NAMES[i], bytes: k * 1024, sites: site ? [site] : [], used: site ? 'الصفحة الرئيسية' : 'لم تُستخدم بعد',
  })))
  return (
    <V6Gallery
      assets={assets}
      sites={SITES.map((x) => ({ id: x.id, name: x.name }))}
      upload={async (files) => {
        await wait(700)
        const added: V6Asset[] = files.map((f, i) => ({ id: 'u' + Date.now() + i, url: URL.createObjectURL(f), name: f.name, bytes: f.size, sites: [], used: 'لم تُستخدم بعد' }))
        setAssets((a) => [...added, ...a])
        return { added: added.map((a) => a.id), failed: [] }
      }}
      remove={async (id) => { setAssets((a) => a.filter((x) => x.id !== id)); return true }}
    />
  )
}

const BOOK: V6Booking[] = [
  { id: '1', name: 'سارة الحمادي', d: 0, time: '19:00', people: 2, st: 'new', phone: '+971 50 123 4510', note: 'نفضّل طاولة بجانب النافذة إن أمكن، ولدينا طفل صغير.' },
  { id: '2', name: 'ليلى منصور', d: 0, time: '20:30', people: 4, st: 'new', phone: '+971 50 123 4512', note: null },
  { id: '3', name: 'خالد بن راشد', d: 0, time: '13:30', people: 3, st: 'ok', phone: '+971 50 123 4511', note: null },
  { id: '4', name: 'منى القاسمي', d: 1, time: '14:00', people: 6, st: 'ok', phone: '+971 50 123 4516', note: 'عيد ميلاد، نحتاج مكانًا للكعكة.' },
  { id: '5', name: 'يوسف الكعبي', d: 2, time: '20:00', people: 2, st: 'ok', phone: '+971 50 123 4517', note: null },
  { id: '6', name: 'فهد العتيبي', d: 3, time: '21:15', people: 5, st: 'new', phone: '+971 50 123 4519', note: null },
  { id: '7', name: 'عمر الشريف', d: -1, time: '21:00', people: 2, st: 'done', phone: '+971 50 123 4513', note: null },
  { id: '8', name: 'هدى العتيبي', d: -2, time: '19:30', people: 4, st: 'cancel', phone: '+971 50 123 4514', note: null },
].map((b) => ({ ...b, email: null, kind: 'حجز طاولة', site: 'مطعم المدينة', st: b.st as V6Booking['st'] }))

export function BookingsView({ go }: { go: Go }) {
  const list = useMemo(() => BOOK, [])
  return (
    <V6Bookings
      bookings={list}
      receiving
      setReceiving={async () => { await wait(300); return null }}
      siteName="مطعم المدينة"
      setStatus={async () => { await wait(250); return true }}
      create={async (b) => {
        await wait(400)
        return { id: 'm' + Date.now(), name: b.name, phone: b.phone || null, email: null, note: b.note || null, people: b.people, d: b.d, time: b.time, st: 'ok', kind: 'حجز طاولة', site: 'مطعم المدينة' }
      }}
      undoCreate={async () => true}
      links={{ settings: { onSelect: () => go('settings') } }}
    />
  )
}

const REVIEWS: V6Review[] = [
  { id: 'r1', name: 'خالد المري', rating: 5, origin: 'google', at: 'قبل يومين', text: 'أجواء هادئة وخدمة ممتازة. المشاوي طازجة والحمص من أفضل ما جرّبت في المدينة.', shown: true },
  { id: 'r2', name: 'أحمد سالم', rating: 4, origin: 'google', at: 'اليوم', text: 'الأكل لذيذ والمكان نظيف. الانتظار كان أطول قليلًا يوم الجمعة، لكن يستحق.', shown: false, isNew: true },
  { id: 'r3', name: 'ريم العلي', rating: 5, origin: 'google', at: 'قبل أسبوع', text: 'احتفلنا بعيد ميلاد والدتي هنا، والفريق جهّز كل شيء بذوق. شكرًا لكم.', shown: true },
  { id: 'r4', name: 'فهد الكعبي', rating: 5, origin: 'google', at: 'قبل أسبوعين', text: 'أفضل فتوش في المنطقة. الحجز من الموقع كان سهلًا وسريعًا.', shown: true },
  { id: 'r5', name: 'عائلة الشامسي', rating: 5, origin: 'manual', at: 'أضفته أنت', text: 'نأتي كل أسبوع مع العائلة. المكان مريح للأطفال والطعام دائمًا ممتاز.', shown: true },
  { id: 'r6', name: 'منى راشد', rating: 3, origin: 'google', at: 'قبل شهر', text: 'الطعام جيد لكن الموسيقى كانت عالية قليلًا تلك الليلة.', shown: false },
]

export function ReviewsView({ siteId, setSiteId }: { siteId: string; setSiteId: (id: string) => void }) {
  const [rows, setRows] = useState<V6Review[]>(REVIEWS)
  const sites = SITES.filter((s) => s.id !== 's5').map((s) => ({ id: s.id, name: s.name }))
  const sid = sites.some((s) => s.id === siteId) ? siteId : 's1'
  const main = sid === 's1'
  const ordered = (rs: V6Review[]) => [...rs.filter((r) => r.shown), ...rs.filter((r) => !r.shown)]
  return (
    <V6Reviews
      sites={sites}
      siteId={sid}
      onSite={setSiteId}
      source={main ? { link: 'https://maps.app.goo.gl/almadina', rating: 4.7, count: 128, fetched: 'قبل 3 ساعات' } : null}
      reviews={main ? ordered(rows) : []}
      heading="ماذا يقول ضيوفنا"
      fetchGoogle={async () => { await wait(1200); return main ? { error: null, added: 0 } : { error: 'في النسخة التجريبية نجلب التقييمات لمطعم المدينة فقط', added: 0 } }}
      toggle={async (id) => { setRows((rs) => rs.map((r) => (r.id === id ? { ...r, shown: !r.shown, isNew: false } : r))); return true }}
      save={async (id, v) => {
        setRows((rs) => (id ? rs.map((r) => (r.id === id ? { ...r, ...v } : r)) : [{ id: 'm' + Date.now(), origin: 'manual', at: 'أضفته أنت', shown: true, ...v }, ...rs]))
        return true
      }}
      move={async (id, to) => {
        setRows((rs) => {
          const shown = rs.filter((r) => r.shown)
          const i = shown.findIndex((r) => r.id === id), j = to === 'up' ? i - 1 : i + 1
          if (i < 0 || j < 0 || j >= shown.length) return rs
          ;[shown[i], shown[j]] = [shown[j], shown[i]]
          return [...shown, ...rs.filter((r) => !r.shown)]
        })
        return true
      }}
      remove={async (id) => {
        const before = rows
        setRows((rs) => rs.filter((r) => r.id !== id))
        return () => setRows(before)
      }}
    />
  )
}

export function SeoView({ siteId, setSiteId, go }: { siteId: string; setSiteId: (id: string) => void; go: Go }) {
  const sites = SITES.filter((s) => s.id !== 's5')
  const sid = sites.some((s) => s.id === siteId) ? siteId : 's1'
  const cur = sites.find((s) => s.id === sid)!
  return (
    <V6Seo
      sites={sites.map((s) => ({
        id: s.id, name: s.name, live: s.live, url: s.id === 's1' ? 'https://almadina.ae' : 'https://' + (s.host || (SLUG[s.id] || 'name') + '.beynoun.com'),
        auto: { title: `${s.name} | ${s.kind}`, desc: `زوروا ${s.name}. ${s.kind} في دبي. تواصلوا معنا واحجزوا مباشرة من الموقع.`, keywords: [s.name, s.kind] },
        own: s.id === 's1' ? { title: SEO_SITE.title, desc: SEO_SITE.description, keywords: SEO_SITE.keywords.split(/,\s*/) } : { title: '', desc: '', keywords: [] },
        logo: null,
      }))}
      siteId={sid}
      onSite={setSiteId}
      gsc={cur.live ? { kind: 'added', email: GSC_EMAIL, numbers: { onSelect: () => go('analytics:search') } } : { kind: 'publish', to: { onSelect: () => go('sites') } }}
      titleMax={60}
      descMax={160}
      save={async () => { await wait(500); return null }}
      uploadLogo={async (_id, f) => { await wait(500); return { url: URL.createObjectURL(f) } }}
      setLogo={async () => true}
    />
  )
}

export function DomainsView({ siteId }: { siteId: string }) {
  const { toast } = useV6()
  const [extra, setExtra] = useState<V6Domain[]>([])
  const rows: V6Domain[] = [
    { id: 'd1', domain: 'almadina.ae', site: 'مطعم المدينة', state: 'live', renews: '12 مارس 2027' },
    { id: 'd2', domain: 'atlasstudio.app', site: 'أطلس ستوديو', state: 'live', renews: '2 يونيو 2027' },
    { id: 'd3', domain: 'waha-wellness.co', site: 'واحة العافية', state: 'pending_dns' },
    ...extra,
    ...SITES.filter((s) => s.host).map((s) => ({ id: 'free:' + s.id, domain: s.host!, site: s.name, state: 'live' as const, free: true })),
  ]
  const recs = [{ type: 'A', name: '@', value: '76.76.21.21' }, { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' }]
  return (
    <V6Domains
      domains={rows}
      sites={SITES.filter((s) => s.live).map((s) => ({ id: s.id, name: s.name }))}
      current={siteId}
      canConnect
      isPro
      connect={async (sid, domain) => {
        await wait(600)
        setExtra((x) => [...x, { id: 'n' + Date.now(), domain, site: SITES.find((s) => s.id === sid)?.name || '', state: 'pending_dns' }])
        return { records: recs }
      }}
      check={async () => { await wait(1200); return { state: 'pending_dns' } }}
      records={async () => { await wait(300); return recs }}
      remove={async () => true}
      search={async (q) => {
        await wait(700)
        return { rows: [['.com', 12.99], ['.store', 4.99], ['.site', 3.99], ['.ae', 39], ['.online', 2.99]].map(([t, p]) => ({ domain: q + t, price: p as number })) }
      }}
      buy={async () => { await wait(400); toast('في اللوحة الحقيقية تنتقل هنا إلى صفحة الدفع', { ok: false }); return { error: 'هذه نسخة تجريبية، لا شراء فيها' } }}
      links={{ sites: {}, pricing: {} }}
    />
  )
}

export function BillingView() {
  const { toast } = useV6()
  const soon = () => toast('في اللوحة الحقيقية تفتح هنا بوابة Stripe', { ok: false })
  return (
    <V6Billing
      current={{ label: 'Pro نشط', price: '24.99$', per: 'شهريًا', renews: 'يتجدّد تلقائيًا في 14 نوفمبر 2026', on: '14 نوفمبر 2026', inc: V6_PLANS[2].inc, paid: true, id: 'pro' }}
      card={{ brand: 'visa', last4: '4242', exp: '08/28', holder: 'NADIA H.' }}
      invoices={INVOICES.map((i) => ({ id: i.id, date: i.date, amount: i.amount, status: i.status, tone: 'ok', pdf: null }))}
      plans={V6_PLANS}
      portal={soon}
      choose={() => ({ onSelect: soon })}
    />
  )
}

export function SettingsView() {
  return (
    <V6Settings
      name="نادية العامري"
      email="nadia@almadina.co"
      saveAccount={async () => { await wait(400); return { ok: true, msg: 'تم الحفظ' } }}
      hasPassword
      pwNote="غيّرتها قبل 3 أشهر"
      changePassword={async () => { await wait(500); return null }}
      signOutOthers={async () => { await wait(300); return true }}
      notices={[
        { key: 'booking', label: 'حجز جديد', sub: 'بريد فور وصول كل حجز', on: true },
        { key: 'review', label: 'تقييم جديد', sub: 'عندما يكتب أحد تقييمًا على Google', on: true },
        { key: 'product', label: 'تحديثات بينون', sub: 'مزايا جديدة، مرة في الشهر', on: true },
        { key: 'offers', label: 'عروض وتخفيضات', sub: 'خصومات على الباقات والنطاقات', on: false },
      ]}
      setNotice={async () => true}
      englishReady={false}
      sites={SITES.length}
      deleteAccount={async () => { await wait(400); return false }}
    />
  )
}
