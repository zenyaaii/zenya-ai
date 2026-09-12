import Link from 'next/link'
import { AUTH_CSS } from '../styles'

export const metadata = { title: 'خطأ في المصادقة', robots: { index: false, follow: false } }

/**
 * Where a sign-in link lands when it has expired or has already been spent.
 *
 * WHAT THE OLD SCREEN DID WRONG, beyond being on the previous visual
 * language: it opened with a 20x20 red disc carrying a ⚠️ emoji at 4xl. An
 * emoji is a font-dependent picture of an idea — it renders differently on
 * every platform, it is read aloud by a screen reader as "warning sign", and
 * at that size it was the largest object on a screen whose actual job is one
 * sentence and one button. The house language reports state with a rule and
 * a colour, not with a glyph borrowed from a keyboard.
 *
 * The heading also sat at text-3xl font-extrabold — a marketing weight on an
 * error page. It says the same thing at the card's own h1 size.
 */
export default function AuthCodeError() {
  return (
    <main className="zs-wrap">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      <div className="zs-card">
        <div className="zs-top">
          <h1 className="zs-h1">خطأ في المصادقة</h1>
          <p className="zs-sub">
            حدثت مشكلة في التحقّق من رابط تسجيل الدخول. ربما انتهت صلاحيته أو استُخدم من قبل.
          </p>
        </div>

        <div className="zs-note" data-tone="error">
          <p>الروابط صالحة لمرة واحدة، ولمدة محدودة.</p>
        </div>

        <Link href="/login" className="zs-submit zs-submit-link">
          حاول مرة أخرى
        </Link>
      </div>
    </main>
  )
}
