import { COMPANY } from '@/lib/company'

/**
 * subprocessors: the live document's clauses, moved without a word changed.
 *
 * GENERATED FROM app/(main)/subprocessors/page.tsx and then reviewed by hand. The
 * copy is the live copy: this is a restyle, so no clause was rewritten,
 * renumbered, added or dropped. What changed is that every heading now
 * carries a stable id so a clause can be linked from an e-mail, the title
 * and the "last updated" line moved to the shell (which prints the date from
 * COMPANY.LAST_UPDATED rather than repeating it five times), and each table
 * sits in its own scroll container so the document never scrolls sideways.
 */

const SUBPROCESSORS = [
  {
    name: 'Supabase',
    role: 'قاعدة البيانات والمصادقة وتخزين الملفات',
    data: 'بيانات حساب المستخدم، القوالب المُولّدة، سجلّ الاستخلاص، سجلّات الاشتراك',
    location: 'أيرلندا (الاتحاد الأوروبي)',
    safeguard: 'مُستضاف في الاتحاد الأوروبي؛ بنود تعاقدية قياسية في اتفاقية معالجة البيانات',
    url: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    role: 'الاستضافة وشبكة توصيل المحتوى الطرفية والنشر',
    data: 'كل حركة HTTP، سجلّات الطلبات، بيانات نشر وصفية',
    location: 'الولايات المتحدة (مع حافة في الاتحاد الأوروبي)',
    safeguard: 'إطار خصوصية البيانات بين الاتحاد الأوروبي والولايات المتحدة + بنود تعاقدية قياسية',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Stripe',
    role: 'معالجة المدفوعات وفوترة الاشتراكات وبوابة العملاء',
    data: 'الاسم، البريد الإلكتروني، عنوان الفوترة، تفاصيل وسيلة الدفع (البطاقة عبر Stripe وليس عبرنا)، سجلّ المعاملات',
    location: 'الولايات المتحدة / أيرلندا (شركة تابعة في الاتحاد الأوروبي)',
    safeguard: 'إطار خصوصية البيانات بين الاتحاد الأوروبي والولايات المتحدة + بنود تعاقدية قياسية',
    url: 'https://stripe.com/privacy',
  },
  {
    name: 'OpenAI',
    role: 'توليد محتوى القوالب عبر النماذج اللغوية الكبيرة',
    data: 'وصف النشاط التجاري الذي تُرسله (دون إرفاق أي معرّفات حساب)',
    location: 'الولايات المتحدة',
    safeguard: 'بيانات الواجهة لا تُستخدم للتدريب (وفق شروط واجهة OpenAI) + بنود تعاقدية قياسية',
    url: 'https://openai.com/policies/privacy-policy',
  },
  {
    name: 'ScraperAPI',
    role: 'استخلاص صفحات المنتجات (فقط عند فشل الجلب المباشر)',
    data: 'رابط المنتج الذي تُرسله',
    location: 'الولايات المتحدة',
    safeguard: 'بنود تعاقدية قياسية',
    url: 'https://www.scraperapi.com/privacy-policy',
  },
  {
    name: 'Shopify',
    role: 'المصادقة (OAuth) وواجهات المنتجات/القوالب (فقط إن ربطت متجرًا)',
    data: 'نطاق المتجر، بريد مالك المتجر، بيانات المنتجات، بيانات القالب',
    location: 'كندا (قرار كفاية بموجب المادة ٤٥ من GDPR)',
    safeguard: 'قرار الكفاية بين الاتحاد الأوروبي وكندا',
    url: 'https://www.shopify.com/legal/privacy',
  },
] as const

export const SECTIONS = [
  {
    "id": "s-x1",
    "level": 2,
    "text": "التغييرات"
  }
] as const

export default function Doc() {
  return (
    <>

      <p>
        يستعين {COMPANY.PRODUCT_NAME} بخدمات الأطراف الخارجية التالية لتشغيل
        الخدمة. ويتصرّف كلٌّ منها بصفته معالجًا للبيانات بموجب اللائحة العامة
        لحماية البيانات في الاتحاد الأوروبي (GDPR). ولا تُشارَك البيانات الشخصية
        إلا بالقدر اللازم، وتحكمها اتفاقية معالجة بيانات (DPA) حيثما تنطبق،
        ومحميّة بضمانات نقل مناسبة.
      </p>

      {/* SIX COLUMNS OF ARABIC PROSE DO NOT FIT A PHONE, and a scroller is not
          the answer at 390: measured on the live page the الرابط column is
          22.4px wide and breaks its own heading into را/ب/ط while Shopify
          stacks as Sh/op/ify. So the same one table is a record list below
          768 and a real table above it, driven by CSS alone. The ARIA roles
          are explicit because display:block on a table element drops the
          native table semantics, and the labels each cell grows on the phone
          come from data-label, so the header row is never read twice. */}
      <div className="zl-tw">
        <table role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" scope="col">المزوّد</th>
              <th role="columnheader" scope="col">الدور</th>
              <th role="columnheader" scope="col">البيانات المُشاركة</th>
              <th role="columnheader" scope="col">الموقع</th>
              <th role="columnheader" scope="col">الضمان</th>
              <th role="columnheader" scope="col">الخصوصية</th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {SUBPROCESSORS.map((s) => (
              <tr role="row" key={s.name}>
                <td role="cell" className="zl-td-name"><strong>{s.name}</strong></td>
                <td role="cell" data-label="الدور">{s.role}</td>
                <td role="cell" data-label="البيانات المُشاركة">{s.data}</td>
                <td role="cell" data-label="الموقع">{s.location}</td>
                <td role="cell" data-label="الضمان">{s.safeguard}</td>
                <td role="cell" data-label="الخصوصية">
                  {/* The visible word stays the document's own: رابط. Six links
                      reading "رابط" do not say where they go, so the vendor's
                      name is added for a screen reader only. That is an
                      accessible name, not a rewrite of the copy. */}
                  <a href={s.url} target="_blank" rel="noopener">
                    رابط<span className="zl-a11y"> إلى سياسة خصوصية {s.name}</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="s-x1">التغييرات</h2>
      <p>
        نُشعِر العملاء بأي معالجين فرعيين جُدد عبر تحديث هذه الصفحة قبل{' '}
        <strong>١٥ يومًا</strong> على الأقل من بدئهم معالجة البيانات الشخصية،
        مع إتاحة الوقت للاعتراض عبر{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>.
      </p>
    </>
  )
}
