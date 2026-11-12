import type { NicheKind } from './kinds'

/**
 * The help under each build question (Anas, 2026-11-12):
 *  - an example the owner can take with one tap and then edit
 *  - a marketing tip from real reviews, shown only where it holds: in the
 *    owner's own country, or everywhere when it held in three countries or more
 *
 * Tips come from the review analyses (the 2026-11-10 barber read of the
 * leads' Google reviews; /mnt/project-files/beynoun/content-engine/
 * niche-questions/*.json for the kinds after it). A tip with countries ['*']
 * held in three countries or more.
 */

export type Tip = { text: string; countries: string[] }

type Help = {
  /** Question id → tips, first that fits wins. */
  tips: Record<string, Tip[]>
  /** FAQ question → an example answer. */
  faq: Record<string, string>
  /** Field id → an example value. */
  examples: Record<string, string>
}

export const HELP: Partial<Record<NicheKind, Help>> = {
  barber: {
    tips: {
      socials: [{ text: 'زبائن الحلاق يحكمون بالصور قبل الكلام. حساب إنستغرام فيه قصّات حقيقية يعطينا أفضل صور لموقعك.', countries: ['*'] }],
      barbers: [{ text: 'أكثر ما يمدحه الزبائن في تقييمات الحلاقين: الحلاق باسمه. «حلقت عند عمار» تتكرر أكثر من أي مديح آخر.', countries: ['*'] }],
      services: [{ text: 'أكثر ما يغضب الزبون: سعر يفاجئه عند الدفع. السعر المكتوب، حتى لو كان «يبدأ من»، يبني الثقة قبل أن يأتي.', countries: ['*'] }],
      booking: [{ text: 'الانتظار الطويل ثاني أكثر شكوى في تقييمات الحلاقين. قل للزبون متى يكون المحل هادئًا، فيأتي في وقت يناسبك.', countries: ['*'] }],
      photos: [{ text: 'صورة الكرسي والمحل النظيف تُذكر في التقييمات كثيرًا. صوّر المحل في ضوء النهار وهو مرتب.', countries: ['*'] }],
      faq: [{ text: 'كل سؤال تجيب عنه هنا هو سؤال لن يرسله لك الزبون على واتساب.', countries: ['*'] }],
    },
    faq: {
      'هل أحتاج موعدًا، أم أحضر مباشرة؟': 'نستقبل بموعد وبدون موعد. الموعد يضمن لك ألا تنتظر.',
      'كم أنتظر عادة؟': 'من 10 إلى 20 دقيقة في المساء، وأقل في الصباح.',
      'هل السعر المكتوب هو ما أدفعه؟': 'نعم. السعر المكتوب هو السعر النهائي، بلا إضافات.',
      'هل تحلقون للأطفال؟': 'نعم، للأطفال من عمر 3 سنوات.',
      'هل يوجد موقف سيارات قريب؟': 'نعم، يوجد موقف أمام المحل.',
    },
    examples: {
      wait: '10 إلى 20 دقيقة مساء الخميس',
      busy: 'الخميس والجمعة بعد المغرب',
      extra: 'نقدّم قهوة للزبون أثناء الانتظار، وعندنا ألعاب للأطفال.',
      wish: 'كنت أتمنى سؤالًا عن العروض الأسبوعية.',
    },
  },
}

const PHONE_CC: [string, string][] = [
  ['962', 'JO'], ['966', 'SA'], ['971', 'AE'], ['965', 'KW'], ['974', 'QA'], ['973', 'BH'], ['968', 'OM'],
  ['964', 'IQ'], ['961', 'LB'], ['963', 'SY'], ['970', 'PS'], ['212', 'MA'], ['216', 'TN'], ['213', 'DZ'], ['218', 'LY'], ['20', 'EG'],
]

/** The owner's country from an international phone number, when it has one. */
export function countryOfPhone(phone: string): string | null {
  const d = phone.replace(/[^\d+]/g, '').replace(/^00/, '+')
  if (!d.startsWith('+')) return null
  const hit = PHONE_CC.find(([cc]) => d.slice(1).startsWith(cc))
  return hit ? hit[1] : null
}

export function tipFor(kind: NicheKind, question: string, country: string | null): string | null {
  const tips = HELP[kind]?.tips[question] || []
  const t = tips.find((x) => x.countries.includes('*') || (country && x.countries.includes(country)))
  return t ? t.text : null
}

export const exampleFor = (kind: NicheKind, field: string): string | undefined => HELP[kind]?.examples[field]
export const faqExample = (kind: NicheKind, q: string): string | undefined => HELP[kind]?.faq[q]
