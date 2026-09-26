'use client'

/**
 * Google Search Console, on the two screens where it belongs.
 *
 * CONNECT ON SEO, READ ON ANALYTICS. The SEO screen is where an owner decides
 * how the site looks inside Google, so that is where they link their Google
 * account and add the site to it. The Analytics screen is where they read
 * numbers, so that is where Google's numbers sit. The backend for both has
 * been in app/api/gsc/** all along; these are the two faces of it.
 *
 * Like every screen in this folder it takes data and Actions as props, so
 * /demo/dashboard can draw it from sample data and the live dashboard from
 * the owner's account.
 */

import { ArrowUpDown, Eye, MousePointerClick, Percent } from 'lucide-react'
import { Tile } from '@/components/dashboard/analytics/primitives'
import { Act, type Action } from './kit'

export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number }
export type GscQuery = { query: string; clicks: number; impressions: number; ctr: number; position: number }

/** Where the selected site stands inside the owner's Search Console. */
export type GscSiteState = 'checking' | 'added' | 'missing' | 'not_published' | 'working' | 'failed'

const G = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
  </svg>
)

/* ── SEO: connect ───────────────────────────────────────────────────────── */

export type GscConnectProps = {
  /** 'off' = the platform has no Google OAuth client; the block hides. */
  status: 'off' | 'disconnected' | 'connected'
  email?: string | null
  siteName?: string
  siteState?: GscSiteState
  /** Google's own words when a setup step failed. */
  siteError?: string
  /** The stored grant predates the write scopes: setup needs a fresh consent. */
  needsReconnect?: boolean
  connect?: Action
  setup?: Action
  disconnect?: Action
  seeNumbers?: Action
}

export function GscConnect({
  status, email, siteName, siteState = 'checking', siteError, needsReconnect, connect, setup, disconnect, seeNumbers,
}: GscConnectProps) {
  if (status === 'off') return null

  const head = (
    <div className="flex min-w-0 items-center gap-2.5">
      {G}
      <div className="min-w-0">
        <h3 className="zy-h3">Google Search Console</h3>
        {status === 'connected' ? (
          <p className="zy-sub mt-0.5 truncate">
            مربوط بحساب <span dir="ltr" className="font-bold text-[#171717]">{email}</span>
          </p>
        ) : (
          <p className="zy-sub mt-0.5">زر واحد: نربط حسابك في جوجل ونضيف موقعك إليه، ثم ترى في التحليلات كم مرة ظهر في البحث وبأي كلمات.</p>
        )}
      </div>
    </div>
  )

  if (status === 'disconnected') {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl zy-card p-4 sm:p-5">
        {head}
        <Act action={connect} className="zy-btn shrink-0">اربط حساب جوجل</Act>
      </div>
    )
  }

  const site = siteLine(siteName || '', siteState, siteError)
  return (
    <div className="mb-4 rounded-2xl zy-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {head}
        <Act action={disconnect} className="zy-btn-q shrink-0">فصل الحساب</Act>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4" style={{ boxShadow: 'inset 0 1px 0 rgba(17,17,17,0.08)' }}>
        <div className="flex min-w-[15rem] flex-1 items-start gap-2">
          <span className="zy-pill mt-0.5 shrink-0" data-tone={site.tone}>{site.pill}</span>
          <span className="zy-sub min-w-0 flex-1">{site.body}</span>
        </div>
        {siteState === 'added' && <Act action={seeNumbers} className="zy-btn-q shrink-0">شاهد الأرقام</Act>}
        {(siteState === 'missing' || siteState === 'failed') && (
          <Act action={setup} className="zy-btn shrink-0">{needsReconnect ? 'اربط الحساب من جديد' : siteState === 'failed' ? 'حاول مرة أخرى' : 'أضِف الموقع إلى جوجل'}</Act>
        )}
        {siteState === 'working' && <span className="zy-btn shrink-0 opacity-60">جارٍ الإضافة…</span>}
      </div>
    </div>
  )
}

function siteLine(name: string, state: GscSiteState, error?: string) {
  switch (state) {
    case 'added':
      return { tone: 'ok', pill: 'مُضاف', body: `${name} مُضاف في Search Console، وجوجل يرسل أرقامه.` }
    case 'missing':
      return { tone: 'warn', pill: 'غير مُضاف', body: `${name} غير مُضاف بعد. نضيفه ونرسل خريطة الموقع بنقرة واحدة.` }
    case 'not_published':
      return { tone: 'quiet', pill: 'غير منشور', body: `انشر ${name} أولًا، ثم أضِفه إلى جوجل.` }
    case 'working':
      return { tone: 'accent', pill: 'جارٍ', body: 'نثبت ملكيتك للموقع عند جوجل ونضيفه. قد يأخذ هذا بضع ثوانٍ.' }
    case 'failed':
      return { tone: 'bad', pill: 'لم يكتمل', body: error || 'لم يؤكّد جوجل ملكية الموقع بعد. انتظر دقيقة ثم حاول مرة أخرى.' }
    default:
      return { tone: 'quiet', pill: '…', body: 'نتحقّق من حالة الموقع عند جوجل.' }
  }
}

/* ── Analytics: numbers ─────────────────────────────────────────────────── */

export type GscNumbersProps = {
  status: 'off' | 'disconnected' | 'loading' | 'missing' | 'not_published' | 'ok' | 'error'
  sites: Array<{ id: string; name: string }>
  selectedId: string
  onSelect?: (id: string) => void
  totals?: GscTotals
  queries?: GscQuery[]
  /** Where to connect or add the site: the SEO screen. */
  toSeo?: Action
}

/**
 * Google search as its own section of Analytics, drawn like the traffic tiles
 * above it: four figures in a row, then the words people searched. It is per
 * site, because a Search Console property is one site.
 */
export function GscNumbers({
  status, sites, selectedId, onSelect, totals, queries = [], toSeo,
}: GscNumbersProps) {
  if (status === 'off') return null

  const picker = status !== 'disconnected' && sites.length > 1 && (
    <div className="flex flex-wrap items-center gap-1.5">
      {sites.map((s) => {
        const on = s.id === selectedId
        return onSelect ? (
          <button key={s.id} type="button" onClick={() => onSelect(s.id)} aria-pressed={on}
            className="zy-pill cursor-pointer" data-tone={on ? 'accent' : 'quiet'}>{s.name}</button>
        ) : (
          <span key={s.id} className="zy-pill" data-tone={on ? 'accent' : 'quiet'}>{s.name}</span>
        )
      })}
    </div>
  )

  let body: React.ReactNode
  if (status === 'disconnected' || status === 'missing' || status === 'not_published' || status === 'error') {
    const text = {
      disconnected: 'اربط حسابك في جوجل من صفحة السيو بزر واحد، وستظهر هنا مرات ظهور موقعك في البحث والنقرات والكلمات.',
      missing: 'هذا الموقع غير مُضاف في Search Console بعد. أضِفه بنقرة من صفحة السيو.',
      not_published: 'هذا الموقع غير منشور، فلا يراه جوجل بعد.',
      error: 'تعذّر جلب الأرقام من جوجل الآن. أعد تحميل الصفحة بعد لحظات.',
    }[status]
    body = (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl zy-card p-4 sm:p-5">
        <p className="zy-sub max-w-[60ch]">{text}</p>
        {(status === 'disconnected' || status === 'missing') && (
          <Act action={toSeo} className="zy-btn shrink-0">{status === 'disconnected' ? 'اربط من صفحة السيو' : 'أضِفه من صفحة السيو'}</Act>
        )}
      </div>
    )
  } else if (status === 'loading') {
    body = (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl zy-card" />)}
      </div>
    )
  } else {
    const t = totals ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    const max = Math.max(1, ...queries.map((q) => q.impressions))
    body = (
      <>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Tile label="مرات الظهور" value={t.impressions.toLocaleString('ar')} icon={Eye} sub="في نتائج جوجل" />
          <Tile label="النقرات" value={t.clicks.toLocaleString('ar')} icon={MousePointerClick} sub="دخلوا موقعك من البحث" />
          <Tile label="نسبة النقر" value={t.impressions ? `${(t.ctr * 100).toFixed(1)}%` : '—'} icon={Percent} sub="نقرات من كل ظهور" />
          <Tile label="الترتيب" value={t.position ? t.position.toFixed(1) : '—'} icon={ArrowUpDown} sub="متوسط · الأقل أفضل" />
        </div>
        {t.impressions === 0 ? (
          <p className="zy-sub mt-4 rounded-2xl zy-card p-4 sm:p-5">
            جوجل لم يسجّل ظهورًا لهذا الموقع بعد. الفهرسة تأخذ عادةً من أيام إلى أسبوعين بعد النشر.
          </p>
        ) : queries.length > 0 && (
          <div className="mt-4 min-w-0 overflow-hidden rounded-2xl zy-card">
            <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-4">
              <h3 className="zy-h3">الكلمات التي وجدوك بها</h3>
              <span className="shrink-0 text-[14.5px] font-medium text-[#66666e]">ظهور · نقرات</span>
            </div>
            <ul className="divide-y divide-[color:var(--border)]">
              {queries.slice(0, 8).map((q) => (
                <li key={q.query} className="relative px-4 py-2.5">
                  <div className="absolute inset-y-0 start-0 bg-[rgba(94,106,210,0.08)]" style={{ width: `${(q.impressions / max) * 100}%` }} aria-hidden />
                  <div className="relative flex items-baseline justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-foreground">{q.query}</span>
                    <span className="shrink-0 whitespace-nowrap text-[14.5px] tabular-nums text-foreground">
                      {q.impressions.toLocaleString('ar')}
                      <span className="ms-1.5 text-muted">· {q.clicks.toLocaleString('ar')}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="mt-8 pt-6" style={{ boxShadow: 'inset 0 1px 0 rgba(17,17,17,0.08)' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="zy-h2 flex items-center gap-2">{G}<span>بحث جوجل</span></h2>
          <p className="zy-sub mt-1">آخر 28 يومًا · أرقام حقيقية من Google Search Console</p>
        </div>
        {picker}
      </div>
      {body}
    </section>
  )
}
