/**
 * The review channel.
 *
 * It used to be one topic inside the five-topic contact form, which is why
 * the stars sat as a small row under the message box and why a review with no
 * rating was something the intake had to refuse. Rating is a single gesture,
 * so it gets a page: the five stars are the largest object on it and
 * everything else is the sentence around them.
 *
 * WHAT HAPPENS WHEN IT IS SENT. Three calls, in order. /api/reviews writes
 * the row as pending — a founder reads it before it can appear anywhere.
 * /api/contact runs second and returns the thank-you code. /api/promo-codes
 * saves that code against a signed-in account and is best-effort; it 401s for
 * a guest, which is why the reader is told to copy the code rather than wait
 * for an e-mail.
 *
 * DESIGN READ: one instrument on bare paper. Flat #fafafa, hairline rings for
 * elevation, no wash and no gradient anywhere on the page.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 3.
 *
 * NO GOLD FOR THE STARS. A star is data — the value being set — so it takes
 * the accent, which is what the house style already allows data to do. An
 * invented gold would be a second hue on an achromatic page, and it would be
 * the only colour on it that means nothing.
 *
 * THE WALL IS EMPTY ON PURPOSE. Zenya is early and has refused to ship
 * invented testimonials from the beginning. The wall holds labelled
 * placeholders and says plainly what they are waiting for. Filling it with
 * three plausible founders would break that refusal in a nicer typeface.
 */

import type { Metadata } from 'next'
import ReviewView from '@/components/zenya/review/ReviewView'
import { REVIEW_REWARD_AR } from '@/lib/review-reward'

export const metadata: Metadata = {
  title: 'قيّم تجربتك مع زينيا',
  description: `شارك تجربتك الصادقة مع زينيا — في صالحنا أو لم تكن — واحصل على ${REVIEW_REWARD_AR} كشكرٍ على وقتك. نقرأ كل مراجعة قبل نشرها.`,
  alternates: { canonical: '/review' },
  openGraph: {
    title: 'قيّم تجربتك مع زينيا',
    description: 'شارك تجربتك الصادقة. نقرأ كل مراجعة قبل نشرها، ولا نعرض شهادات مُختلَقة.',
    url: 'https://zenyaai.co/review',
  },
}

export default function ReviewPage() {
  return <ReviewView />
}
