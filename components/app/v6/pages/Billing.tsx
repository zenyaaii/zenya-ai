'use client'

/**
 * BILLING, as the v6 design draws it (VIEWS.billing, planSheet): the plan
 * card, the card on file, the invoices, and the three plans.
 *
 * Stripe is the record. «إدارة الاشتراك» and «حدّث البطاقة» open Stripe's
 * portal; an invoice is Stripe's own PDF; a plan change goes to checkout, or
 * to the portal when there is a subscription to change.
 */

import { useRef } from 'react'
import { A, type Act } from '../Home'
import { Ic, reduceMotion, useV6 } from '../ui'
import { PageHead, at } from './kit'

export type V6Plan = { id: string; t: string; p: string; inc: string[] }
/** The three plans as the v6 design words them: the same promises as PLAN_BILLING, shorter. */
export const V6_PLANS: V6Plan[] = [
  { id: 'entry', t: 'المجانية', p: '0$', inc: ['توليد موقعين', 'كل القوالب الثمانية للمعاينة', 'انشر على عنوان مجاني من بينون', 'شهر تجربة للحجوزات والتحليلات'] },
  { id: 'starter', t: 'Starter', p: '14.99$', inc: ['توليد غير محدود', 'انشر على نطاقك الخاص', 'شهادة SSL تلقائية', 'الحجوزات والتحليلات كاملة', 'ملف ثيم شوبيفاي جاهز'] },
  { id: 'pro', t: 'Pro', p: '24.99$', inc: ['كل ما في Starter', 'نطاق مجاني لسنة', 'خصم 30% على النطاقات', 'إزالة شارة «صُنع ببينون»', 'دعم بأولوية قصوى'] },
]

export type V6Invoice = { id: string; date: string; amount: string; status: string; tone: string; pdf: string | null }

export type V6BillingProps = {
  current: {
    label: string
    /** «24.99$» and «شهريًا» */
    price: string
    per: string | null
    /** «يتجدّد تلقائيًا في 14 نوفمبر 2026», or a line for a plan with no renewal. */
    renews: string
    /** The renewal date alone, for the plan sheet's «ابتداءً من». */
    on: string | null
    inc: string[]
    paid: boolean
    /** Which of the plans below it is, if any. */
    id: string | null
  }
  card: { brand: string; last4: string; exp: string; holder: string } | null
  invoices: V6Invoice[]
  plans: V6Plan[]
  /** Stripe's portal, when the account has a Stripe customer. */
  portal: (() => void) | null
  /** Where moving to a plan happens. */
  choose: (id: string) => Act
}

export default function V6Billing(p: V6BillingProps) {
  const { openSheet, closeSheet } = useV6()
  const plansT = useRef<HTMLHeadingElement>(null)
  const curIdx = p.plans.findIndex((x) => x.id === p.current.id)

  function planSheet(x: V6Plan) {
    const down = curIdx >= 0 && p.plans.indexOf(x) < curIdx
    const cur = curIdx >= 0 ? p.plans[curIdx] : null
    const items = down && cur ? cur.inc.filter((t) => !x.inc.includes(t)) : x.inc
    const go = p.choose(x.id)
    openSheet({
      title: 'الانتقال إلى ' + x.t,
      body: (
        <>
          <p className="t-body">{down ? `عند الانتقال إلى ${x.t} ستفقد بعض المزايا في نهاية الشهر الحالي:` : `تحصل فورًا على كل مزايا ${x.t}:`}</p>
          <ul className="incl" style={{ listStyle: 'none', padding: 0 }}>
            {items.map((t) => <div key={t}><Ic n={down ? 'x' : 'check'} /><span>{t}</span></div>)}
          </ul>
          <p className="t-small" style={{ marginTop: 16 }}>السعر الجديد: <b className="num" style={{ color: 'var(--ink)' }}>{x.p}</b> شهريًا{p.current.on ? `، ابتداءً من ${p.current.on}` : ''}.</p>
        </>
      ),
      foot: (
        <>
          <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
          <A to={{ ...go, onSelect: () => { closeSheet(); go.onSelect?.() } }} className={`btn ${down ? 'danger solid' : 'k'} press`}>تأكيد الانتقال</A>
        </>
      ),
    })
  }

  return (
    <>
      <PageHead title="الفوترة" sub="باقتك، وطريقة الدفع، وفواتيرك." />
      <div className="bill">
        <section className="card rv" style={at(2)}>
          <div className="plan-top">
            <div>
              <span className={`pill ${p.current.paid ? 'ok' : ''}`}>{p.current.paid && <Ic n="check" />}{p.current.label}</span>
              <div className="price" style={{ marginTop: 12 }}><span className="num">{p.current.price}</span>{p.current.per && <> <small>/ {p.current.per}</small></>}</div>
              <p className="t-small" style={{ marginTop: 4 }}>{p.current.renews}</p>
            </div>
            <div className="row-wrap">
              {p.portal && p.current.paid && <button className="btn line sm press" onClick={p.portal}>إدارة الاشتراك</button>}
              <button className="btn sm press" onClick={() => plansT.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })}>غيّر الباقة</button>
            </div>
          </div>
          <div className="incl">{p.current.inc.map((t) => <div key={t}><Ic n="check" /><span>{t}</span></div>)}</div>
        </section>
        <section className="card rv" style={at(3)}>
          <div className="card-h"><h2 className="t-h3">طريقة الدفع</h2></div>
          {p.card ? (
            <>
              <div className="ccard" aria-label={`بطاقة ${p.card.brand} تنتهي بـ ${p.card.last4}`}>
                <span className="brand">{p.card.brand.toUpperCase()}</span>
                <span className="no num">•••• {p.card.last4}</span>
                <span className="exp"><span>{p.card.holder}</span><span className="num">{p.card.exp}</span></span>
              </div>
              {p.portal && <button className="btn sm press" style={{ marginTop: 16 }} onClick={p.portal}><Ic n="card" />حدّث البطاقة</button>}
            </>
          ) : (
            <div className="rows"><div className="r"><span className="tile"><Ic n="card" /></span><span className="tx"><b>لا توجد بطاقة محفوظة</b><span>تُحفظ بطاقتك عند أول اشتراك، في Stripe وحده.</span></span></div></div>
          )}
        </section>
      </div>
      <h2 className="sec-title rv" style={{ ...at(4), marginTop: 28 }}>الفواتير</h2>
      <section className="card flush rv" style={at(5)}>
        {p.invoices.length ? (
          <table className="tbl">
            <thead><tr><th>الفاتورة</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th className="end"><span className="sr">تحميل</span></th></tr></thead>
            <tbody>
              {p.invoices.map((i) => (
                <tr key={i.id}>
                  <td className="k ltr" data-l="الفاتورة" style={{ textAlign: 'right' }}>{i.id}</td>
                  <td data-l="التاريخ">{i.date}</td>
                  <td data-l="المبلغ" className="num">{i.amount}</td>
                  <td data-l="الحالة"><span className={`pill ${i.tone}`}>{i.status}</span></td>
                  <td className="end">
                    {i.pdf && <a className="btn sm line press" href={i.pdf} target="_blank" rel="noopener noreferrer" aria-label={`حمّل الفاتورة ${i.id}`}><Ic n="download" /><span>تحميل</span></a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty"><Ic n="card" /><b>لا فواتير بعد</b><span>تظهر هنا فواتيرك من Stripe بعد أول دفعة.</span></div>
        )}
      </section>
      <h2 className="sec-title rv" id="plansT" ref={plansT} style={{ ...at(6), marginTop: 28 }}>الباقات</h2>
      <div className="plans">
        {p.plans.map((x, i) => {
          const cur = x.id === p.current.id
          return (
            <section key={x.id} className={`card plan rv${cur ? ' cur' : ''}`} style={at(7 + i)}>
              <div className="card-h" style={{ margin: 0 }}><h3 className="t-h3">{x.t}</h3>{cur && <span className="pill solid-ok">باقتك</span>}</div>
              <div className="price"><span className="num">{x.p}</span> <small>/ شهريًا</small></div>
              <ul>{x.inc.map((t) => <li key={t}><Ic n="check" /><span>{t}</span></li>)}</ul>
              {cur
                ? <button className="btn block" disabled>باقتك الحالية</button>
                : <button className="btn block line press" onClick={() => planSheet(x)}>انتقل إلى {x.t}</button>}
            </section>
          )
        })}
      </div>
    </>
  )
}
