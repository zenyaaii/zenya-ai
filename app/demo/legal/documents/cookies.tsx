import { COMPANY } from '@/lib/company'

/**
 * cookies: the live document's clauses, moved without a word changed.
 *
 * GENERATED FROM app/(main)/cookies/page.tsx and then reviewed by hand. The
 * copy is the live copy: this is a restyle, so no clause was rewritten,
 * renumbered, added or dropped. What changed is that every heading now
 * carries a stable id so a clause can be linked from an e-mail, the title
 * and the "last updated" line moved to the shell (which prints the date from
 * COMPANY.LAST_UPDATED rather than repeating it five times), and each table
 * sits in its own scroll container so the document never scrolls sideways.
 */



export const SECTIONS = [
  {
    "id": "s-1",
    "level": 2,
    "text": "١. ما هي ملفات تعريف الارتباط؟"
  },
  {
    "id": "s-2",
    "level": 2,
    "text": "٢. الفئات التي نستخدمها"
  },
  {
    "id": "s-2-1",
    "level": 3,
    "text": "٢.١ ضرورية تمامًا (مفعّلة دائمًا)"
  },
  {
    "id": "s-2-2",
    "level": 3,
    "text": "٢.٢ وظيفية (تتطلّب موافقة)"
  },
  {
    "id": "s-2-3",
    "level": 3,
    "text": "٢.٣ تحليلية (تتطلّب موافقة — معطّلة افتراضيًا حاليًا)"
  },
  {
    "id": "s-2-4",
    "level": 3,
    "text": "٢.٤ تسويقية (تتطلّب موافقة — غير مستخدمة)"
  },
  {
    "id": "s-3",
    "level": 2,
    "text": "٣. ملفات تعريف الارتباط من أطراف خارجية عند الدفع"
  },
  {
    "id": "s-4",
    "level": 2,
    "text": "٤. إدارة اختياراتك"
  },
  {
    "id": "s-5",
    "level": 2,
    "text": "٥. التواصل"
  }
] as const

export default function Doc() {
  return (
    <>

      <p>
        توضّح سياسة ملفات تعريف الارتباط هذه كيف تستخدم {COMPANY.LEGAL_NAME}
        («نحن») ملفات تعريف الارتباط وتقنيات التتبّع المشابهة على{' '}
        <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>.
      </p>

      <h2 id="s-1">١. ما هي ملفات تعريف الارتباط؟</h2>
      <p>
        ملفات تعريف الارتباط هي ملفات نصية صغيرة يخزّنها متصفّحك على جهازك. وهي
        تتيح للمواقع تذكّرك وتذكّر تفضيلاتك. كما نستخدم تقنيات مشابهة مثل{' '}
        <code>localStorage</code> لحفظ التفضيلات على جانب العميل.
      </p>

      <h2 id="s-2">٢. الفئات التي نستخدمها</h2>

      <h3 id="s-2-1">٢.١ ضرورية تمامًا (مفعّلة دائمًا)</h3>
      <p>
        هذه مطلوبة لعمل الخدمة. ولا نطلب موافقة عليها بموجب قانون الاتحاد
        الأوروبي لأنه لا يمكنك إيقافها دون تعطيل الخدمة.
      </p>
      <div className="zl-tw"><table>
        <thead>
          <tr><th>الاسم</th><th>الغرض</th><th>المدة</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>جلسة مصادقة Supabase</td>
            <td>سنة واحدة (تُجدَّد)</td>
          </tr>
          <tr>
            <td><code>zenya_return_to</code></td>
            <td>تذكّر المكان الذي نعيدك إليه بعد مصادقة Shopify (OAuth)</td>
            <td>١٠ دقائق</td>
          </tr>
          <tr>
            <td><code>zenya_consent</code> (localStorage)</td>
            <td>تذكّر اختيارك في شريط ملفات تعريف الارتباط</td>
            <td>١٢ شهرًا</td>
          </tr>
          <tr>
            <td><code>zenya_last_email</code> (localStorage)</td>
            <td>تعبئة نموذج تسجيل الدخول مسبقًا على هذا الجهاز</td>
            <td>حتى المسح</td>
          </tr>
        </tbody>
      </table></div>

      <h3 id="s-2-2">٢.٢ وظيفية (تتطلّب موافقة)</h3>
      <p>
        تُحسّن الخدمة (مثل تفضيل الوضع الداكن). نستخدم حاليًا{' '}
        <code>localStorage</code> لهذه ولا نضبطها إلا بعد استخدامك الفعلي
        للميزة.
      </p>

      <h3 id="s-2-3">٢.٣ تحليلية (تتطلّب موافقة — معطّلة افتراضيًا حاليًا)</h3>
      <p>
        إذا/عندما نُفعّل تحليلات المنتج (مثل Plausible أو Vercel Analytics)،
        سندرج كل مزوّد هنا ولن نُحمّلها إلا بعد قبولك لملفات تعريف الارتباط
        التحليلية في الشريط.
      </p>

      <h3 id="s-2-4">٢.٤ تسويقية (تتطلّب موافقة — غير مستخدمة)</h3>
      <p>
        لا نستخدم حاليًا أي ملفات تعريف ارتباط للإعلانات أو إعادة الاستهداف.
        وإذا تغيّر ذلك، ستُحدَّث هذه الصفحة وسترى الشريط يطلب الموافقة من جديد.
      </p>

      <h2 id="s-3">٣. ملفات تعريف الارتباط من أطراف خارجية عند الدفع</h2>
      <p>
        عند إتمام الدفع عبر Stripe Checkout، قد تضبط Stripe ملفات تعريف الارتباط
        الخاصة بها على نطاق <code>checkout.stripe.com</code> لمنع الاحتيال
        وإدارة الجلسات. وتخضع هذه لـ{' '}
        <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener">
          سياسة ملفات تعريف الارتباط الخاصة بـ Stripe
        </a>.
      </p>

      <h2 id="s-4">٤. إدارة اختياراتك</h2>
      <ul>
        <li>استخدم رابط «تفضيلات ملفات تعريف الارتباط» في التذييل لتغيير موافقتك.</li>
        <li>تتيح لك معظم المتصفّحات حظر ملفات تعريف الارتباط من الإعدادات، لكن حظر الملفات الضرورية تمامًا سيُعطّل تسجيل الدخول.</li>
        <li>يمكنك مسح ملفات تعريف الارتباط وlocalStorage في أي وقت من متصفّحك.</li>
      </ul>

      <h2 id="s-5">٥. التواصل</h2>
      <p>
        أسئلة حول ملفات تعريف الارتباط؟{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
      </p>
    </>
  )
}
