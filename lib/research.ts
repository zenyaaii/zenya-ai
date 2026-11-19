import FILES from './research-files.json'

/**
 * The admin «البحوث» tab: every research file the content agent produced,
 * sorted by folder in content/research/ (not public/: the files are served
 * only to admins, through /api/admin/research). The list is generated —
 * add files under content/research/ and run `node scripts/research-index.cjs`.
 */
export type ResearchFile = {
  p: string; group: string; sub: string | null; name: string; date: string
  ext: string; kind: string; heading: string; size: number
}
export const RESEARCH_FILES = FILES as ResearchFile[]

export const GROUPS: Record<string, { t: string; note: string }> = {
  '1-reports': { t: 'التقارير', note: 'تحليل المنافسين والسوق، مكتوبة للقراءة.' },
  '2-plans': { t: 'الخطط والمواصفات', note: 'خطة ديسمبر، ونظام البناء، وأسئلة كل نشاط.' },
  '3-niches': { t: 'حسب النشاط', note: 'كل نشاط في مجلد: التقرير، والإعلانات، وتيك توك، وإنستغرام، والتقييمات، والمواقع.' },
  '4-market-data': { t: 'بيانات السوق العامة', note: 'البيانات الخام لكل المنافسين، مرتبة حسب النوع.' },
  '5-agent-tools': { t: 'أدوات الوكيل', note: 'الكود الذي جمع البيانات وحللها.' },
}

export const NICHES: Record<string, string> = {
  barber: 'صالون الحلاقة', beauty: 'صالون التجميل', car: 'خدمات السيارات', carwash: 'غسيل السيارات',
  dental: 'عيادة الأسنان', derma: 'الجلدية والتجميل', florist: 'محل الورد', laundry: 'المغسلة',
  massage: 'المساج', nails: 'الأظافر', pet: 'الحيوانات الأليفة', photo: 'استوديو التصوير',
  physio: 'العلاج الطبيعي', spa: 'السبا', tailor: 'الخياط', gym: 'النادي الرياضي', restaurant: 'المطعم',
}

/** Data types: one label per kind, in the order they are listed. */
export const TYPES: Array<[string, string]> = [
  ['report', 'التقرير الكامل'], ['summary', 'الخلاصة'], ['ads', 'الإعلانات'], ['tiktok', 'تيك توك'],
  ['instagram', 'إنستغرام'], ['reviews', 'التقييمات'], ['sites', 'المواقع'], ['trends', 'اتجاهات البحث'],
  ['news', 'الأخبار'], ['analysis', 'تحليلات الوكيل'], ['build-questions', 'أسئلة البناء'], ['cost', 'تكلفة الجمع'],
]
const TYPE = Object.fromEntries(TYPES)

/** Finer names for market-data files, by kind. */
const KIND: Record<string, string> = {
  'ads-2': 'الإعلانات · الدفعة الثانية', 'google-reviews': 'تقييمات جوجل للمنافسين',
  'niche-google-reviews': 'تقييمات جوجل لكل نشاط', 'appstore-reviews': 'تقييمات متجر التطبيقات (سلة، زد…)',
  'site-speed': 'سرعة المواقع', comments: 'تعليقات المنشورات', 'competitor-map': 'خريطة حسابات المنافسين',
  'competitor-sample': 'عينة منشورات المنافسين', ig50: '٥٠ حسابًا (كامل)', 'ig50-rows': '٥٠ حسابًا (صفوف)',
  'post-analysis': 'تحليل المنشورات', 'strategy-analysis': 'تحليل الاستراتيجية',
}

export function titleOf(f: ResearchFile): string {
  if ((f.group === '1-reports' || f.group === '2-plans') && f.heading) return f.heading
  if (f.group === '5-agent-tools') return f.name
  const t = KIND[f.kind] ?? TYPE[f.kind] ?? f.kind
  // A niche has each type twice: the written analysis and the raw data behind it.
  if (f.group === '3-niches' && f.kind !== 'report' && f.kind !== 'summary') return `${t} · ${f.ext === 'md' ? 'القراءة' : 'البيانات الخام'}`
  return t
}
/** What the file is for the reader: a report to read, or data. */
export const formOf = (f: ResearchFile) =>
  f.ext === 'md' ? (f.group === '3-niches' && f.kind !== 'report' && f.kind !== 'summary' ? 'تحليل' : 'تقرير')
  : f.ext === 'html' ? 'صفحة' : f.ext === 'json' ? 'بيانات' : 'كود'
export const subTitle = (group: string, sub: string) => (group === '3-niches' ? NICHES[sub] ?? sub : TYPE[sub] ?? sub)

export const sizeOf = (n: number) => (n < 1024 ? `${n} بايت` : n < 1024 * 1024 ? `${Math.round(n / 1024)} ك.ب` : `${(n / 1024 / 1024).toFixed(1)} م.ب`)
export const dateOf = (d: string) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '')
export const sortKey = (f: ResearchFile) => { const i = TYPES.findIndex(([k]) => k === f.kind); return i < 0 ? 99 : i }

/** Only listed paths are ever served: no traversal through ?p=. */
export const findFile = (p: string) => RESEARCH_FILES.find((f) => f.p === p)
/** A group id is "all", a top folder ("3-niches"), or folder/sub ("3-niches/barber"). */
export const filesIn = (g: string) => (g === 'all' ? RESEARCH_FILES : RESEARCH_FILES.filter((f) => f.p.startsWith(`${g}/`)))
