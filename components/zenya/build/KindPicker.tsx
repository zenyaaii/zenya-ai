"use client"

import { useEffect, useRef } from 'react'

/**
 * «مشروعك أيّ واحد؟» — the sheet that opens over a wizard after the owner
 * pressed «ابنِ» on a template (Anas, 2026-11-10). It lists only the kinds
 * that template builds, and a tap goes straight to that kind's questions: no
 * second confirm, the options close and the questions open.
 *
 * Drawn in the night's tokens (it sits inside the «ليل» product frame), with
 * literal fallbacks so it reads on any ground.
 */

export type Kind = { id: string; name: string; hint: string }

export const KINDS: Record<'services' | 'restaurant' | 'wellness', { template: string; kinds: Kind[] }> = {
  services: {
    template: 'الخدمات',
    kinds: [
      { id: 'barber', name: 'صالون حلاقة', hint: 'الحلاقون، القصّات، المواعيد' },
      { id: 'car', name: 'ورشة سيارات', hint: 'الإصلاح، المدة، الضمان' },
      { id: 'clinic', name: 'عيادة', hint: 'الطبيب، المواعيد، التأمين' },
      { id: 'photo', name: 'استوديو تصوير', hint: 'المعرض، الباقات' },
      { id: 'other', name: 'خدمة أخرى', hint: 'سباكة، تكييف، تنظيف، وغيرها' },
    ],
  },
  restaurant: {
    template: 'المطعم',
    kinds: [
      { id: 'restaurant', name: 'مطعم', hint: 'المنيو، الأطباق، الحجز' },
      { id: 'cafe', name: 'مقهى', hint: 'المشروبات، الجلسات' },
      { id: 'sweets', name: 'حلويات ومخبز', hint: 'المنتجات، طلبات المناسبات' },
    ],
  },
  wellness: {
    template: 'العافية',
    kinds: [
      { id: 'gym', name: 'نادٍ رياضي', hint: 'الاشتراكات، المدربون' },
      { id: 'beauty', name: 'مركز تجميل', hint: 'الخدمات، الأعمال' },
      { id: 'spa', name: 'سبا ومساج', hint: 'الجلسات، الهدوء' },
    ],
  },
}

export default function KindPicker({ group, onPick }: { group: keyof typeof KINDS; onPick: (id: string) => void }) {
  const g = KINDS[group]
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => { first.current?.focus({ preventScroll: true }) }, [])
  return (
    <div className="kp" role="dialog" aria-modal="true" aria-labelledby="kp-q" dir="rtl">
      <div className="kp-scrim" />
      <section className="kp-sheet">
        <span className="kp-grab" aria-hidden />
        <div className="kp-head">
          <span className="kp-eye">ابنِ بقالب {g.template}</span>
          <h2 id="kp-q">مشروعك أيّ واحد؟</h2>
          <p>لكل نوع أسئلته وأقسامه. نسألك فقط ما يخص نشاطك.</p>
        </div>
        <div className="kp-grid">
          {g.kinds.map((k, i) => (
            <button key={k.id} ref={i === 0 ? first : undefined} type="button" className={`kp-tile${k.id === 'other' ? ' wide' : ''}`} onClick={() => onPick(k.id)}>
              <b>{k.name}</b><span>{k.hint}</span>
            </button>
          ))}
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  )
}

const CSS = `
.kp{position:fixed;inset:0;z-index:80;display:grid;align-items:end;justify-items:center}
.kp-scrim{position:absolute;inset:0;background:rgba(8,7,6,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:kp-fade .3s both}
.kp-sheet{position:relative;width:100%;max-height:92vh;overflow:auto;background:var(--card,#1A1713);color:var(--ink,#F4EFE6);border:1px solid var(--line2,rgba(244,239,230,.16));border-radius:28px 28px 0 0;padding:22px max(18px,env(safe-area-inset-left,0px)) calc(26px + env(safe-area-inset-bottom,0px));display:grid;gap:18px;animation:kp-up .45s cubic-bezier(.2,.8,.2,1) both}
@media(min-width:900px){.kp{align-items:center}.kp-sheet{width:min(860px,calc(100vw - 48px));border-radius:28px;padding:34px 36px;animation-name:kp-in}}
.kp-grab{width:44px;height:5px;border-radius:9px;background:var(--line2,rgba(244,239,230,.16));justify-self:center}
@media(min-width:900px){.kp-grab{display:none}}
.kp-head{display:grid;gap:4px}
.kp-eye{color:var(--acc,#E2532A);font-size:16px;font-weight:600}
.kp-head h2{font-family:var(--f-head,inherit);font-weight:700;line-height:1.2;font-size:clamp(28px,4.4vw,42px);margin:0;color:inherit}
.kp-head p{color:var(--mut,#A39A8D);font-size:17px;margin:0}
.kp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media(min-width:900px){.kp-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}}
.kp .kp-tile{display:grid;gap:2px;text-align:start;background:var(--bg2,#24201A);color:inherit;border:1px solid var(--line,rgba(244,239,230,.08));border-radius:18px;padding:14px 16px;min-height:84px;cursor:pointer;transition:border-color .2s,background .2s;font:inherit}
.kp .kp-tile b{font-size:20px;font-weight:600}
.kp .kp-tile span{font-size:15px;color:var(--mut,#A39A8D);line-height:1.35}
.kp .kp-tile:hover{border-color:var(--acc,#E2532A)}
.kp .kp-tile:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:3px}
.kp .kp-tile.wide{grid-column:1/-1;min-height:0}
@keyframes kp-fade{from{opacity:0}}
@keyframes kp-up{from{transform:translateY(100%)}}
@keyframes kp-in{from{opacity:0;transform:translateY(16px)}}
@media(prefers-reduced-motion:reduce){.kp-scrim,.kp-sheet{animation:none}}
`
