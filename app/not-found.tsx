import Link from 'next/link'
import { headers } from 'next/headers'
import LaylShell from '@/components/zenya/redesign/layl'
import { Hero } from '@/components/zenya/chrome/Parts'

export const metadata = { title: 'الصفحة غير موجودة', robots: { index: false, follow: false } }

/**
 * The 404 for Beynoun's own hosts, in «ليل». Until 2026-11-02 there was none,
 * and an address that did not exist got Next's default: «404 | This page could
 * not be found.» in English on white.
 *
 * Customer sites have their own (app/s/[slug]/not-found.tsx). A path deeper
 * than any of their routes can still fall through to this one, and a customer's
 * visitor must not meet Beynoun's page there, so on a customer host (the
 * x-zenya-site header middleware sets) it is a plain, unbranded line.
 */
export default function NotFound() {
  if (headers().get('x-zenya-site') === '1') {
    return (
      <main dir="rtl" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: 40, fontWeight: 700, margin: 0 }}>404</p>
          <p style={{ margin: '8px 0 0' }}>هذه الصفحة غير موجودة.</p>
        </div>
      </main>
    )
  }
  return (
    <LaylShell word="٤٠٤">
      <Hero
        eyebrow="رابط غير صحيح"
        title="هذه الصفحة"
        mark="غير موجودة."
        intro={['ربما تغيّر الرابط أو نُقلت الصفحة. ابدأ من الرئيسية أو تصفّح القوالب.']}
        actions={
          <>
            <Link href="/" className="zx-act-1">إلى الرئيسية</Link>
            <Link href="/templates" className="zx-act-2">تصفّح القوالب</Link>
          </>
        }
      />
    </LaylShell>
  )
}
