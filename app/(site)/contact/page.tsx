/**
 * The contact page.
 *
 * Five topics, one intake. The form validates with the rules
 * app/api/contact/route.ts enforces — a real address, a message of at least
 * five characters — and posts to that route, which is the same endpoint the
 * page carried before the restyle. Nothing about where a message goes
 * changed; the screen around it did.
 *
 * REVIEWS ARE NOT SENT FROM HERE. The intake refuses a review with no stars,
 * and this form has no stars to give it. /review is the page that does, and
 * the review topic links there rather than pretending it can carry one.
 *
 * DESIGN READ: a channel page for someone who wants an answer from a real
 * person, in the house language — flat #fafafa, near-black Arabic at display
 * size, hairline rings instead of shadows, and the accent only on the field
 * in focus and the action that sends.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 5.
 *
 * EVERY FACT ON THE REGISTER CARD COMES FROM lib/company.ts, the module the
 * five legal pages already read. Two values are not in it and are declared in
 * the view rather than invented: the telephone number the owner gave for this
 * page, and Musannef's own address on the web. No street address is printed
 * anywhere — that is deliberate and long-standing — and no VAT number is
 * printed until there is one to print.
 */

import type { Metadata } from 'next'
import ContactView from '@/components/zenya/contact/ContactView'

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description:
    'تواصل مع فريق زينيا — الدعم، طلب قالب جديد، المبيعات، أو أي شيء آخر. نردّ خلال يوم عمل واحد.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'تواصل مع زينيا',
    description: 'الدعم، طلب قالب، المبيعات. نردّ خلال يوم عمل واحد.',
    url: 'https://zenyaai.co/contact',
  },
}

type Topic = 'support' | 'request' | 'sales' | 'review' | 'other'

/**
 * ?topic= is read HERE, on the server, and handed down as a prop.
 *
 * The page it replaced read it with useSearchParams() inside a Suspense
 * boundary. That shape works on a first load and breaks on a client-side
 * navigation into this route: a suspended subtree carrying the page's inline
 * <style> blanks the whole page for the length of the suspense, and the
 * header CTA on every other page is a client-side navigation. No hook and no
 * boundary means nothing to reconcile.
 *
 * The one link that still uses it is the template request from /themes.
 * Anything unrecognised falls back to support, which is what the old page did
 * by never matching it against the topic list.
 */
export default function ContactPage({
  searchParams,
}: {
  searchParams?: { topic?: string }
}) {
  const asked = searchParams?.topic
  const initialTopic: Topic =
    asked === 'request' || asked === 'sales' || asked === 'review' || asked === 'other'
      ? asked
      : 'support'
  return <ContactView initialTopic={initialTopic} />
}
