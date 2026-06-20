import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `سياسة ملفات تعريف الارتباط — ${COMPANY.BRAND_NAME}`,
  description: `كيف ولماذا يستخدم ${COMPANY.PRODUCT_NAME} ملفات تعريف الارتباط والتقنيات المشابهة.`,
  alternates: { canonical: '/cookies' },
}

export default function CookiePolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral">
      <h1>سياسة ملفات تعريف الارتباط</h1>
      <p className="text-sm text-muted">آخر تحديث: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        توضّح سياسة ملفات تعريف الارتباط هذه كيف تستخدم {COMPANY.LEGAL_NAME}
        («نحن») ملفات تعريف الارتباط وتقنيات التتبّع المشابهة على{' '}
        <a href={COMPANY.WEBSITE_URL}>{COMPANY.WEBSITE_URL}</a>.
      </p>

      <h2>١. ما هي ملفات تعريف الارتباط؟</h2>
      <p>
        ملفات تعريف الارتباط هي ملفات نصية صغيرة يخزّنها متصفّحك على جهازك. وهي
        تتيح للمواقع تذكّرك وتذكّر تفضيلاتك. كما نستخدم تقنيات مشابهة مثل{' '}
        <code>localStorage</code> لحفظ التفضيلات على جانب العميل.
      </p>

      <h2>٢. الفئات التي نستخدمها</h2>

      <h3>٢.١ ضرورية تمامًا (مفعّلة دائمًا)</h3>
      <p>
        هذه مطلوبة لعمل الخدمة. ولا نطلب موافقة عليها بموجب قانون الاتحاد
        الأوروبي لأنه لا يمكنك إيقافها دون تعطيل الخدمة.
      </p>
      <table>
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
      </table>

      <h3>٢.٢ وظيفية (تتطلّب موافقة)</h3>
      <p>
        تُحسّن الخدمة (مثل تفضيل الوضع الداكن). نستخدم حاليًا{' '}
        <code>localStorage</code> لهذه ولا نضبطها إلا بعد استخدامك الفعلي
        للميزة.
      </p>

      <h3>٢.٣ تحليلية (تتطلّب موافقة — معطّلة افتراضيًا حاليًا)</h3>
      <p>
        إذا/عندما نُفعّل تحليلات المنتج (مثل Plausible أو Vercel Analytics)،
        سندرج كل مزوّد هنا ولن نُحمّلها إلا بعد قبولك لملفات تعريف الارتباط
        التحليلية في الشريط.
      </p>

      <h3>٢.٤ تسويقية (تتطلّب موافقة — غير مستخدمة)</h3>
      <p>
        لا نستخدم حاليًا أي ملفات تعريف ارتباط للإعلانات أو إعادة الاستهداف.
        وإذا تغيّر ذلك، ستُحدَّث هذه الصفحة وسترى الشريط يطلب الموافقة من جديد.
      </p>

      <h2>٣. ملفات تعريف الارتباط من أطراف خارجية عند الدفع</h2>
      <p>
        عند إتمام الدفع عبر Stripe Checkout، قد تضبط Stripe ملفات تعريف الارتباط
        الخاصة بها على نطاق <code>checkout.stripe.com</code> لمنع الاحتيال
        وإدارة الجلسات. وتخضع هذه لـ{' '}
        <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener">
          سياسة ملفات تعريف الارتباط الخاصة بـ Stripe
        </a>.
      </p>

      <h2>٤. إدارة اختياراتك</h2>
      <ul>
        <li>استخدم رابط «تفضيلات ملفات تعريف الارتباط» في التذييل لتغيير موافقتك.</li>
        <li>تتيح لك معظم المتصفّحات حظر ملفات تعريف الارتباط من الإعدادات، لكن حظر الملفات الضرورية تمامًا سيُعطّل تسجيل الدخول.</li>
        <li>يمكنك مسح ملفات تعريف الارتباط وlocalStorage في أي وقت من متصفّحك.</li>
      </ul>

      <h2>٥. التواصل</h2>
      <p>
        أسئلة حول ملفات تعريف الارتباط؟{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>
      </p>
    </main>
  )
}
