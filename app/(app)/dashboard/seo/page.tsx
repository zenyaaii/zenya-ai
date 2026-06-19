'use client'

import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'

export default function SeoPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">السيو</h1>
        <p className="mt-1 text-[13px] text-muted">
          عناوين الصفحات، وأوصاف ميتا، وبطاقات Open Graph، وخريطة الموقع. لكل موقع.
        </p>
      </header>

      <ComingSoon />

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="ما يعمل بالفعل" tint="#15803d">
          <Bullet>عنوان ووصف ميتا يُولَّدان تلقائيًا من محتوى موقعك</Bullet>
          <Bullet>بطاقة OpenGraph و Twitter من صورة الواجهة</Bullet>
          <Bullet>بيانات منظَّمة (نشاط محلي، مؤسسة)</Bullet>
          <Bullet>ملفّا Sitemap.xml و robots.txt يُقدَّمان تلقائيًا لكل موقع منشور</Bullet>
        </Card>
        <Card title="قريبًا" tint="#5e6ad2">
          <Bullet>تعديل عنوان الصفحة ووصف ميتا لكل موقع</Bullet>
          <Bullet>رفع صورة OG مخصّصة + تجاوز لكل صفحة</Bullet>
          <Bullet>حقل التحقّق من Google Search Console</Bullet>
          <Bullet>إشعار خريطة الموقع عند النشر</Bullet>
          <Bullet>تجاوزات ترميز Schema.org (ساعات، قائمة، أسعار)</Bullet>
        </Card>
      </section>

      <div className="mt-8 rounded-2xl border border-token bg-white p-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">قائمة اليوم</h2>
        <p className="mt-1 text-[13px] text-muted">
          حتى تتوفّر تعديلات السيو لكل موقع، هذه أكثر الأمور تأثيرًا التي يمكنك فعلها اليوم:
        </p>
        <ol className="mt-4 space-y-3 text-[13px]">
          <Step n={1} title="أرسل خريطة موقعك إلى Google Search Console">
            أضف نطاقك على <Link href="https://search.google.com/search-console" target="_blank" className="text-primary hover:underline">search.google.com/search-console</Link>، وتحقّق منه، ثم أرسل{' '}
            <code className="rounded bg-surface px-1 py-0.5 text-[12px]" dir="ltr">https://yourdomain.com/sitemap.xml</code>.
          </Step>
          <Step n={2} title="تأكّد أن صورة الواجهة تبدو جيدة عند المشاركة">
            ألصق رابطك المباشر في <Link href="https://opengraph.xyz" target="_blank" className="text-primary hover:underline">opengraph.xyz</Link> لمعاينة شكله عند المشاركة على واتساب وتيليجرام والرسائل.
          </Step>
          <Step n={3} title="اكتب عنوانًا فرعيًا واضحًا ومحدّد الموقع">
            «مطعم شرقي عصري في حي السفارات» يتصدّر أفضل من «تجربة استثنائية حقًا». يتيح لك المحرّر فعل ذلك دون إعادة التوليد.
          </Step>
        </ol>
      </div>
    </div>
  )
}

function ComingSoon() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-token bg-white p-6"
      style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(94,106,210,0.06), transparent 70%)' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
             style={{ background: 'white', boxShadow: '0 4px 16px -8px rgba(94,106,210,0.40), 0 0 0 1px rgba(94,106,210,0.20) inset' }}>
          <Search className="h-5 w-5 text-primary" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">أدوات سيو لكل موقع — قريبًا</h2>
          <p className="mt-1 text-[13px] leading-[1.55] text-muted">
            كل موقع تنشره على زينيا يأتي بالفعل ببيانات وصفية مُولَّدة تلقائيًا، وبطاقات OpenGraph،
            وبيانات منظَّمة، وخريطة موقع — جوجل يراك. ستتيح لك هذه الصفحة تجاوز النص المُولَّد تلقائيًا
            لكل موقع (العنوان، الوصف، صورة OG) عندما تريد تحكّمًا كاملًا.
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ title, tint, children }: { title: string; tint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint }}>
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-[13px] leading-[1.55]">{children}</ul>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-foreground">
      <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted" />
      <span>{children}</span>
    </li>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-[10.5px] font-bold text-white">
        {n}
      </span>
      <div className="flex-1">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="mt-0.5 text-muted leading-[1.6]">{children}</div>
      </div>
    </li>
  )
}
