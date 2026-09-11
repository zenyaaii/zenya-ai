import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { REVIEW_REWARD_CODE } from '@/lib/review-reward'

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email(),
  topic: z.enum(['support', 'request', 'sales', 'review', 'other']),
  message: z.string().min(5).max(8000),
})

/** The one code we hand out to reviewers. Matches ReviewOffer.tsx. */
const REVIEW_PROMO_CODE = REVIEW_REWARD_CODE

/** Where a contact message is meant to arrive. */
const INBOX = process.env.CONTACT_INBOX || 'support@zenyaai.co'
/** Resend requires a verified sender on the account's own domain. */
const FROM = process.env.CONTACT_FROM || 'Zenya Contact <noreply@zenyaai.co>'

const TOPIC_LABEL: Record<string, string> = {
  support: 'دعم',
  request: 'طلب قالب',
  sales: 'مبيعات',
  review: 'مراجعة',
  other: 'أخرى',
}

/**
 * Contact-form intake.
 *
 * WHAT THIS USED TO DO, and why it was the worst bug on the site: it validated
 * the message, called console.log, and returned 200. The sender read "تم
 * الإرسال". Nothing was written and nothing was sent, so every support
 * request, template request and sales enquiry lived in a Vercel function log
 * until that log rotated, and then did not exist at all. A form that says it
 * delivered and does not is worse than no form, because the person who wrote
 * it stops waiting for an answer they were never going to get.
 *
 * WHAT IT DOES NOW, in this order:
 *
 *   1. WRITES THE ROW FIRST, to public.contact_messages. This is the half that
 *      must not depend on anything outside the database: if delivery is not
 *      configured, or Resend is down, or the key is wrong, the message is
 *      still on disk and still answerable. A failure here is a 500 and the
 *      sender is told to try again, because silently accepting a message we
 *      did not keep is the thing this route existed to stop doing.
 *
 *   2. TRIES TO E-MAIL IT, if RESEND_API_KEY is set. Over Resend's REST API
 *      through fetch rather than the SDK, so this route adds no dependency
 *      and no cold-start weight for a single POST.
 *
 *   3. RECORDS WHAT HAPPENED to the delivery on the row it just wrote —
 *      emailed_at on success, email_error on failure. NULL in both means
 *      delivery was not configured, which is a different state from "we tried
 *      and it failed" and the difference is what you need when chasing a
 *      message somebody says they sent.
 *
 * THE SENDER IS NOT TOLD ABOUT STEP 2. Once the row is written the message is
 * received, and whether the notification e-mail also went out is our problem,
 * not theirs. Reporting an SMTP failure to someone who has already handed over
 * their question would be asking them to solve our infrastructure.
 *
 * TO TURN ON E-MAIL: set RESEND_API_KEY in the Vercel project, and optionally
 * CONTACT_INBOX and CONTACT_FROM. Nothing else changes; the rows were already
 * being written.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.format() }, { status: 400 })
  }
  const { name, email, topic, message } = parsed.data

  // Cheap honeypot: if a UA-less client posts something that looks like ad-hoc
  // spam, drop it silently so the form still says "sent" to the abuser.
  const ua = req.headers.get('user-agent') || ''
  if (!ua) {
    console.warn('[contact] dropped: no UA', { email })
    return NextResponse.json({ ok: true })
  }

  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    null

  // Reviewers get a discount code as a thank-you. The code itself is a real
  // Stripe promotion code with a first-time-customer restriction, so it can
  // never be redeemed twice. Returning it in the response keeps the promise
  // honest even when e-mail is not configured — the success screen reveals the
  // code inline instead of hoping an email got through.
  const rewardCode = topic === 'review' ? REVIEW_PROMO_CODE : null

  /* ---- 1. keep it ---------------------------------------------------- */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('[contact] cannot store: supabase env missing')
    return NextResponse.json(
      { error: 'store_unavailable', message: 'تعذّر استلام رسالتك. حاول مجددًا.' },
      { status: 500 },
    )
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: row, error: insertError } = await admin
    .from('contact_messages')
    .insert({
      name: name || null,
      email,
      topic,
      message,
      reward_code: rewardCode,
      ip_address: ip,
      user_agent: ua.slice(0, 400),
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[contact] insert failed', insertError)
    return NextResponse.json(
      { error: 'db_error', message: 'تعذّر استلام رسالتك. حاول مجددًا.' },
      { status: 500 },
    )
  }

  /* ---- 2. try to deliver it ------------------------------------------ */
  const key = process.env.RESEND_API_KEY
  if (key) {
    const label = TOPIC_LABEL[topic] || topic
    const text = [
      `من: ${name || '(بدون اسم)'} <${email}>`,
      `الموضوع: ${label}`,
      ip ? `IP: ${ip}` : null,
      '',
      message,
      '',
      `— contact_messages.id = ${row.id}`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [INBOX],
          reply_to: email,
          subject: `[${label}] ${name || email}`,
          text,
        }),
      })

      if (res.ok) {
        await admin
          .from('contact_messages')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', row.id)
      } else {
        const detail = (await res.text().catch(() => '')).slice(0, 400)
        console.error('[contact] resend rejected', res.status, detail)
        await admin
          .from('contact_messages')
          .update({ email_error: `${res.status} ${detail}`.slice(0, 500) })
          .eq('id', row.id)
      }
    } catch (e) {
      // A delivery failure must never fail the request: the message is already
      // stored, so the sender is genuinely received either way.
      const detail = e instanceof Error ? e.message : String(e)
      console.error('[contact] resend threw', detail)
      await admin
        .from('contact_messages')
        .update({ email_error: detail.slice(0, 500) })
        .eq('id', row.id)
    }
  }

  return NextResponse.json({ ok: true, rewardCode })
}
