import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email(),
  topic: z.enum(['support', 'request', 'sales', 'other']),
  message: z.string().min(5).max(8000),
})

/**
 * Contact-form intake.
 *
 * Today: validates the input, logs to the Vercel function log, and returns
 * 200. To upgrade to real email delivery, install Resend (`npm i resend`)
 * and set RESEND_API_KEY, then uncomment the block below. The shape of the
 * request is already fixed so the UI doesn't need to change.
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

  // For now: log only. Replace with Resend when you add an API key.
  console.log('[contact]', {
    topic,
    name,
    email,
    message_preview: message.slice(0, 200),
    received_at: new Date().toISOString(),
  })

  // --- Optional: real delivery via Resend ---
  // if (process.env.RESEND_API_KEY) {
  //   const { Resend } = await import('resend')
  //   const resend = new Resend(process.env.RESEND_API_KEY)
  //   await resend.emails.send({
  //     from: 'Zenya Contact <noreply@zenyaai.co>',
  //     to: 'support@zenyaai.co',
  //     replyTo: email,
  //     subject: `[${topic}] ${name || email}`,
  //     text: `From: ${name || '(no name)'} <${email}>\nTopic: ${topic}\n\n${message}`,
  //   })
  // }

  return NextResponse.json({ ok: true })
}
