'use client'

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Act, EmptyHint, Page, PageHead, type Action } from './kit'

export type SeoScreenProps = {
  sites: Array<{ id: string; name: string; live: boolean }>
  selectedId: string
  onSelect?: (id: string) => void
  site: { name: string; host: string | null }
  title: string
  description: string
  keywords: string
  titleMax: number
  descMax: number
  onTitle?: (v: string) => void
  onDescription?: (v: string) => void
  onKeywords?: (v: string) => void
  save?: Action
  saving?: boolean
  reset?: Action
  /** The Search Console block (see ./search-console). */
  searchConsole?: ReactNode
}

export function SeoScreen({
  sites, selectedId, onSelect, site, title, description, keywords, titleMax, descMax,
  onTitle, onDescription, onKeywords, save, saving = false, reset,
  searchConsole,
}: SeoScreenProps) {
  return (
    <Page>
      <PageHead
        title="السيو"
        sub="تحكّم في شكل موقعك داخل جوجل — العنوان، الوصف، ومعاينة النتيجة الحيّة."
        icon={Search}
      />
      {sites.length === 0 ? (
        <EmptyHint>لا مواقع بعد. انشر موقعًا لتتحكّم في ظهوره داخل جوجل.</EmptyHint>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {sites.map((s) => {
              const on = s.id === selectedId
              const dot = (
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.live ? '#15803d' : '#b45309' }} />
              )
              return onSelect ? (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id)}
                  aria-pressed={on}
                  className="zy-pill cursor-pointer"
                  data-tone={on ? 'accent' : 'quiet'}
                >
                  {dot}{s.name}
                </button>
              ) : (
                <span key={s.id} className="zy-pill" data-tone={on ? 'accent' : 'quiet'}>{dot}{s.name}</span>
              )
            })}
          </div>

          {searchConsole}

          {/* The preview comes FIRST on a phone and second on a desktop: on a
              narrow screen the reader wants to see what the change looks like
              before a column of fields. */}
          <div className="grid gap-4 lg:grid-cols-5">
            <section className="min-w-0 lg:order-2 lg:col-span-2">
              <div className="rounded-2xl zy-card p-4">
                <h3 className="zy-h3 mb-3">معاينة نتيجة جوجل</h3>
                <div className="rounded-[10px] bg-[#f4f4f6] p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[14.5px] font-black text-[#5e6ad2]">
                      {site.name.trim().charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-bold text-[#171717]">{site.name}</div>
                      <div className="truncate text-[14.5px] text-[#56565a]" dir="ltr">{site.host || 'yourname.zenyaai.co'}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[15px] font-medium leading-[1.5] text-[#1a0dab]">{title}</p>
                  <p className="mt-1 text-[14.5px] font-medium leading-[1.7] text-[#56565a]">{description}</p>
                </div>
                <p className="zy-sub mt-3">هكذا يظهر موقعك عند البحث عنه.</p>
              </div>
            </section>

            <section className="min-w-0 lg:order-1 lg:col-span-3">
              <div className="rounded-2xl zy-card p-4 sm:p-5">
                <h3 className="zy-h3">بيانات البحث</h3>
                <p className="zy-sub mt-1.5">اترك الحقل فارغًا لاستخدام النص التلقائي من محتوى موقعك.</p>

                <div className="mt-4 space-y-4">
                  <Field label="عنوان الصفحة (Title)" counter={`${title.length}/${titleMax}`} value={title} onChange={onTitle}
                    hint="ما يظهر كسطر أزرق كبير في نتيجة جوجل. ابدأ باسم النشاط." />
                  <Field label="وصف مبنى (Description)" counter={`${description.length}/${descMax}`} value={description} onChange={onDescription} area
                    hint="السطر الرمادي تحت العنوان. اجعله دعوة واضحة ومحدّدة." />
                  <Field label="كلمات مفتاحية (اختياري)" value={keywords} onChange={onKeywords}
                    hint="افصل بينها بفاصلة." />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Act action={save} className="zy-btn">{saving ? 'جارٍ الحفظ…' : 'احفظ التغييرات'}</Act>
                  <Act action={reset} className="zy-btn-q">إعادة تعيين</Act>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </Page>
  )
}

function Field({
  label, value, hint, counter, area, onChange,
}: {
  label: string
  value: string
  hint: string
  counter?: string
  area?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="text-[14.5px] font-bold text-[#171717]">{label}</label>
        {counter && <span className="shrink-0 text-[14.5px] font-medium tabular-nums text-[#66666e]">{counter}</span>}
      </div>
      {area
        ? <textarea readOnly={!onChange} rows={3} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full px-3 py-2.5 text-[14.5px] font-medium leading-[1.7]" />
        : <input readOnly={!onChange} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full px-3 py-2.5 text-[14.5px] font-medium" />}
      <p className="mt-1.5 text-[14.5px] font-medium leading-[1.7] text-[#66666e]">{hint}</p>
    </div>
  )
}
