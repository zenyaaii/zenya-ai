import type { Metadata } from 'next'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `المعالجون الفرعيون — ${COMPANY.BRAND_NAME}`,
  description: `مزوّدو الخدمات الخارجيون الذين يعالجون البيانات نيابةً عن ${COMPANY.PRODUCT_NAME}.`,
  alternates: { canonical: '/subprocessors' },
}

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

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 prose prose-neutral">
      <h1>المعالجون الفرعيون</h1>
      <p className="text-sm text-muted">آخر تحديث: <strong>{COMPANY.LAST_UPDATED}</strong></p>

      <p>
        يستعين {COMPANY.PRODUCT_NAME} بخدمات الأطراف الخارجية التالية لتشغيل
        الخدمة. ويتصرّف كلٌّ منها بصفته معالجًا للبيانات بموجب اللائحة العامة
        لحماية البيانات في الاتحاد الأوروبي (GDPR). ولا تُشارَك البيانات الشخصية
        إلا بالقدر اللازم، وتحكمها اتفاقية معالجة بيانات (DPA) حيثما تنطبق،
        ومحميّة بضمانات نقل مناسبة.
      </p>

      <table>
        <thead>
          <tr>
            <th>المزوّد</th>
            <th>الدور</th>
            <th>البيانات المُشاركة</th>
            <th>الموقع</th>
            <th>الضمان</th>
            <th>الخصوصية</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((s) => (
            <tr key={s.name}>
              <td><strong>{s.name}</strong></td>
              <td>{s.role}</td>
              <td>{s.data}</td>
              <td>{s.location}</td>
              <td>{s.safeguard}</td>
              <td><a href={s.url} target="_blank" rel="noopener">رابط</a></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>التغييرات</h2>
      <p>
        نُشعِر العملاء بأي معالجين فرعيين جُدد عبر تحديث هذه الصفحة قبل{' '}
        <strong>١٥ يومًا</strong> على الأقل من بدئهم معالجة البيانات الشخصية،
        مع إتاحة الوقت للاعتراض عبر{' '}
        <a href={`mailto:${COMPANY.PRIVACY_EMAIL}`}>{COMPANY.PRIVACY_EMAIL}</a>.
      </p>
    </main>
  )
}
