import { serviceClient } from '@/lib/handover'

/**
 * WhatsApp Cloud API: send from the Beynoun number and log every message.
 *
 * Env: META_TOKEN (system-user token), WA_PHONE_ID (the phone number id,
 * not the business account id).
 *
 * Nothing here sends on its own. Every send is a click by the admin in the
 * dashboard; there are no automatic replies.
 */
const GRAPH = 'https://graph.facebook.com/v25.0'

/** The approved first message. {{1}} is the lead's site link. */
export const SITE_GIFT_TEMPLATE = 'beynoun_site_gift'
export const SITE_GIFT_TEXT = "السلام عليكم، معاكم مؤسس شركة بينون أنس\n\nبعد اطلاع فريق بينون لمشروعك. اكتشفنا ماشاءالله ان مشروعك قائم على الجودة والثقة لعملائكم سواء من النتائج او من مواقع التواصل الاجتماعي. بس في أهم عامل من عوامل الثقة واسبابها ناقص ومشروعك بحاجة إليه, وهو الجذر الأساسي الذي تتفرع منه لمنصات التواصل الاجتماعي, تخيلة موقع بس من دون صفحه رئيسية. وهوا موقعك الإلكتروني واجهتكم الإلكترونية.\nحبينا نعرض لكم اهميتها وحبينا نهديكم ياها. بينون حبة تهديكم موقع خاص فيكم باسمكم جاهز للاستخدام وتحويله لحسابك بعد إنشائه. حرفيا مجاني مدى الحياة. هذا رابط الموقع الخاص فيكم.\n{{1}}\n\nطبعا في معنا خطط باسعار اعلى بس على حسب خبرتنا ما تحتاجها باذن الله هذا كافي لمشروعكم.\n\nالله يوفقكم، واذا تم إنشاء الحساب اتمنا ارسال الاميل الينا عبر الوتس وفي دقائق سيكون في حسابك. وأي مشكلة أو استفسار احنا موجودين.\n\nأنس\nبينون · beynoun.com\nأبن وأدر وانشر موقعك.\n\nالرقم الضريبي: 42070030"

export const fillGift = (link: string) => SITE_GIFT_TEXT.replace('{{1}}', link)

/** Digits only. Egyptian local 01xxxxxxxxx becomes 201xxxxxxxxx. */
export function normWa(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (/^01\d{9}$/.test(d)) d = '2' + d
  return d
}

type SendResult = { ok: true; wamid: string } | { ok: false; error: string }

async function post(payload: object): Promise<SendResult> {
  const token = process.env.META_TOKEN
  const phone = process.env.WA_PHONE_ID
  if (!token || !phone) return { ok: false, error: 'META_TOKEN / WA_PHONE_ID missing' }
  const r = await fetch(`${GRAPH}/${phone}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok || !j?.messages?.[0]?.id) return { ok: false, error: j?.error?.message ?? `HTTP ${r.status}` }
  return { ok: true, wamid: j.messages[0].id }
}

export function sendGift(to: string, link: string) {
  return post({
    to, type: 'template',
    template: {
      name: SITE_GIFT_TEMPLATE, language: { code: 'ar' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: link }] }],
    },
  })
}

export function sendText(to: string, body: string) {
  return post({ to, type: 'text', text: { body, preview_url: true } })
}

/** Log an outgoing message (whether it went or failed). */
export async function logOut(o: { wa: string; leadId?: string | null; kind: string; body: string; res: SendResult }) {
  await serviceClient().from('wa_messages').insert({
    wamid: o.res.ok ? o.res.wamid : null,
    lead_id: o.leadId ?? null,
    wa: o.wa, direction: 'out', kind: o.kind, body: o.body,
    status: o.res.ok ? 'sent' : 'failed',
    error: o.res.ok ? null : o.res.error,
  })
}

/** Has this number written to us in the last 24 hours? (free text allowed) */
export async function windowOpen(wa: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await serviceClient().from('wa_messages')
    .select('id', { count: 'exact', head: true })
    .eq('wa', wa).eq('direction', 'in').gte('at', since)
  return (count ?? 0) > 0
}

/** Turn one webhook `change` (field = messages) into rows. */
export async function ingestWhatsApp(value: any) {
  const db = serviceClient()
  for (const m of value?.messages ?? []) {
    const wa = normWa(m.from)
    const body = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title
      ?? m[m.type]?.caption ?? (m.type !== 'text' ? `[${m.type}]` : '')
    const { data: lead } = await db.from('leads').select('id,status').eq('wa', wa).maybeSingle()
    await db.from('wa_messages').upsert({
      wamid: m.id, lead_id: lead?.id ?? null, wa, direction: 'in', kind: m.type,
      body, status: 'received', at: new Date(Number(m.timestamp) * 1000).toISOString(), raw: m,
    }, { onConflict: 'wamid', ignoreDuplicates: true })
    if (lead && (lead.status === 'new' || lead.status === 'sent')) {
      await db.from('leads').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', lead.id)
    }
  }
  for (const s of value?.statuses ?? []) {
    await db.from('wa_messages')
      .update({ status: s.status, error: s.errors?.[0]?.title ?? null })
      .eq('wamid', s.id)
  }
}
