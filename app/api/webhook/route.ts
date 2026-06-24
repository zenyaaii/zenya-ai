import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { registerDomain, createDnsRecord, PorkbunError } from '@/lib/porkbun'
import { addDomainToProject } from '@/lib/vercel-domains'
import { sendEmail, domainPurchasedEmail, planPurchasedEmail } from '@/lib/email'

// Stripe sends raw body for signature verification. Force the runtime to
// avoid Next's default body parsing transforms.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

type Admin = ReturnType<typeof admin>

function toIsoOrNull(unix: number | null | undefined): string | null {
  if (!unix || !Number.isFinite(unix)) return null
  return new Date(unix * 1000).toISOString()
}

async function logEvent(
  supabase: Admin,
  userId: string | null,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  if (!userId) return
  await supabase.from('activity_logs').insert({
    user_id: userId,
    event_type: eventType,
    metadata: metadata as any,
  })
}

async function linkStripeCustomer(
  supabase: Admin,
  customerId: string,
  email: string | null,
  userId: string | null
) {
  if (!customerId) return
  await supabase
    .from('stripe_customers')
    .upsert(
      { customer_id: customerId, email: email || '', user_id: userId },
      { onConflict: 'customer_id' }
    )
}

// ---------- one-time payment ----------------------------------------------

async function recordOneTimePurchase(
  supabase: Admin,
  session: Stripe.Checkout.Session,
  userId: string
) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price'],
    limit: 1,
  })
  const priceId =
    typeof lineItems.data[0]?.price === 'string'
      ? lineItems.data[0].price
      : lineItems.data[0]?.price?.id || null

  const customerId = typeof session.customer === 'string' ? session.customer : null
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null
  const taxAmount = session.total_details?.amount_tax ?? 0
  const country = session.customer_details?.address?.country || null

  const { error: purchaseErr } = await supabase.from('purchases').upsert(
    {
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      amount_cents: session.amount_total ?? 0,
      currency: (session.currency || 'usd').toLowerCase(),
      tax_amount_cents: taxAmount,
      tax_country: country,
      status: 'paid',
      paid_at: new Date().toISOString(),
      raw_payload: session as any,
    },
    { onConflict: 'stripe_checkout_session_id' }
  )
  if (purchaseErr) throw purchaseErr

  // pro_onetime only upgrades free users — don't downgrade an admin or a
  // hosting subscriber back to pro_onetime.
  const { data: existing } = await supabase
    .from('profiles')
    .select('plan, has_hosting')
    .eq('id', userId)
    .maybeSingle()

  const newPlan =
    existing?.plan === 'admin' || existing?.has_hosting
      ? existing.plan
      : 'pro_onetime'

  await supabase
    .from('profiles')
    .update({
      plan: newPlan,
      is_pro: true,
      pro_purchased_at: new Date().toISOString(),
      pro_amount_cents: session.amount_total ?? 0,
      pro_currency: (session.currency || 'usd').toLowerCase(),
      pro_stripe_session_id: session.id,
      stripe_customer_id: customerId,
    })
    .eq('id', userId)

  await logEvent(supabase, userId, 'purchase.completed', {
    plan: 'onetime',
    session_id: session.id,
    amount_cents: session.amount_total,
    currency: session.currency,
    country,
  })

  // Welcome / thank-you email. Best-effort — never fail the webhook over mail.
  const buyerEmail = session.customer_details?.email || session.customer_email || null
  if (buyerEmail) {
    try {
      const tmpl = planPurchasedEmail({ plan: 'onetime', manageUrl: 'https://zenyaai.co/dashboard' })
      await sendEmail({
        to: buyerEmail,
        subject: tmpl.subject,
        text: tmpl.text,
        html: tmpl.html,
        tags: [{ name: 'type', value: 'plan_onetime' }],
      })
    } catch (e) {
      console.error('[webhook] one-time purchase email failed (non-fatal):', e)
    }
  }
}

// ---------- hosting subscription ------------------------------------------

async function upsertHostingSubscription(
  supabase: Admin,
  sub: Stripe.Subscription,
  userIdHint?: string | null
) {
  let userId =
    userIdHint ||
    (sub.metadata?.user_id as string | undefined) ||
    null

  if (!userId && typeof sub.customer === 'string') {
    const { data } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', sub.customer)
      .maybeSingle()
    userId = data?.user_id || null
  }

  if (!userId) {
    console.warn('[webhook] hosting sub with no resolvable user_id', sub.id)
    return
  }

  const item = sub.items?.data?.[0]
  const price = item?.price
  const customerId = typeof sub.customer === 'string' ? sub.customer : null

  const row = {
    id: sub.id,
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_price_id: price?.id || null,
    status: sub.status,
    currency: (price?.currency || 'usd').toLowerCase(),
    amount_cents: price?.unit_amount ?? 0,
    interval: price?.recurring?.interval || 'month',
    interval_count: price?.recurring?.interval_count ?? 1,
    current_period_start: toIsoOrNull((sub as any).current_period_start),
    current_period_end: toIsoOrNull((sub as any).current_period_end),
    cancel_at_period_end: !!sub.cancel_at_period_end,
    cancel_at: toIsoOrNull(sub.cancel_at as number | null),
    canceled_at: toIsoOrNull(sub.canceled_at as number | null),
    ended_at: toIsoOrNull(sub.ended_at as number | null),
    trial_start: toIsoOrNull(sub.trial_start as number | null),
    trial_end: toIsoOrNull(sub.trial_end as number | null),
    raw_payload: sub as any,
  }

  const { error } = await supabase
    .from('hosting_subscriptions')
    .upsert(row, { onConflict: 'id' })
  if (error) throw error

  // Mirror the boolean has_hosting onto profile for fast UI checks.
  const active = ['active', 'trialing', 'past_due'].includes(sub.status)
  const { data: existing } = await supabase
    .from('profiles')
    .select('plan, is_pro')
    .eq('id', userId)
    .maybeSingle()

  // Admin is a permanent entitlement — never let Stripe sub churn flip
  // their has_hosting/plan/is_pro flags. Audit-row already written above.
  if (existing?.plan === 'admin') {
    await logEvent(supabase, userId, `hosting_subscription.${sub.status}.admin_skip`, {
      subscription_id: sub.id,
      status: sub.status,
    })
    return
  }

  const updates: Record<string, unknown> = {
    has_hosting: active,
    hosting_subscription_id: sub.id,
    hosting_status: sub.status,
    hosting_current_period_end: row.current_period_end,
    hosting_canceled_at: row.canceled_at,
    stripe_customer_id: customerId,
  }

  if (active) {
    updates.hosting_started_at = existing && (existing as any).hosting_started_at
      ? (existing as any).hosting_started_at
      : new Date().toISOString()
    // Upgrade plan label unless this is an admin.
    if (existing?.plan !== 'admin') {
      updates.plan = 'pro_hosting'
      updates.is_pro = true
    }
  } else if (existing?.plan === 'pro_hosting') {
    // Sub ended → drop the hosting label. Keep is_pro=true if they ever paid
    // the one-time (they still own that), otherwise back to free.
    const { data: hadOneTime } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle()
    updates.plan = hadOneTime ? 'pro_onetime' : 'free'
    updates.is_pro = !!hadOneTime
  }

  await supabase.from('profiles').update(updates).eq('id', userId)

  await logEvent(supabase, userId, `hosting_subscription.${sub.status}`, {
    subscription_id: sub.id,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: row.current_period_end,
  })
}

async function recordRefund(supabase: Admin, charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null
  if (!paymentIntentId) return

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, user_id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (!purchase) return

  await supabase
    .from('purchases')
    .update({ status: 'refunded', refunded_at: new Date().toISOString() })
    .eq('id', purchase.id)

  // Only drop them off Pro if they have nothing else granting it.
  const { data: prof } = await supabase
    .from('profiles')
    .select('has_hosting, plan')
    .eq('id', purchase.user_id)
    .maybeSingle()

  if (!prof?.has_hosting && prof?.plan !== 'admin') {
    await supabase
      .from('profiles')
      .update({ plan: 'free', is_pro: false })
      .eq('id', purchase.user_id)
  }

  await logEvent(supabase, purchase.user_id, 'purchase.refunded', {
    charge_id: charge.id,
    payment_intent_id: paymentIntentId,
  })
}

// ---------- domain purchase (Porkbun + Vercel) ----------------------------

const VERCEL_APEX_A = '76.76.21.21'
const VERCEL_CNAME_TARGET = 'cname.vercel-dns.com'

/**
 * Run the post-payment side of a domain purchase:
 *   1. Mark domain_purchases row as `registering`.
 *   2. Register the domain at Porkbun (debits our Porkbun balance).
 *   3. Add the A record at Porkbun so Vercel can verify ownership.
 *   4. Add a www CNAME so visitors hitting either form land safely.
 *   5. Attach the domain to the Vercel project so SSL provisions.
 *   6. Insert into the existing `domains` table so it shows up in the
 *      user's site card immediately.
 *   7. Flip the row to `active` (or `failed` with the error message).
 *
 * Each step swallows its own error into the row so a partial failure
 * (e.g. registered ok, attach failed) leaves a clear breadcrumb. Stripe
 * already kept the money — we surface the error to the operator via
 * domain_purchases.error_message instead of throwing the webhook 500.
 */
async function fulfillDomainPurchase(
  supabase: Admin,
  session: Stripe.Checkout.Session,
  meta: { domain_purchase_id: string; user_id: string; domain: string; years: string; theme_id: string }
) {
  const purchaseId = meta.domain_purchase_id
  const domain = meta.domain.toLowerCase()
  const years = Math.max(1, Math.min(10, Number(meta.years) || 1))
  const themeId = meta.theme_id && meta.theme_id.length > 0 ? meta.theme_id : null
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null

  // Idempotency at the domain level — if the row is already active,
  // bail. (Stripe retries the same event sometimes.)
  const { data: existing } = await supabase
    .from('domain_purchases')
    .select('id, status')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!existing) {
    console.error('[webhook] domain purchase row missing for', purchaseId)
    return
  }
  if (existing.status === 'active') {
    return
  }

  await supabase
    .from('domain_purchases')
    .update({
      status: 'registering',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', purchaseId)

  // 1. Register at Porkbun. If this fails (insufficient funds, premium
  //    mismatch, registry rejection), the user has already paid — so
  //    we auto-refund and write the failure into the row. No human in
  //    the loop for the unhappy path.
  try {
    await registerDomain({ domain, years })
  } catch (e: any) {
    const err = e as PorkbunError
    let refundIssued = false
    let refundError: string | null = null
    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
          metadata: {
            purchase_type: 'domain',
            domain_purchase_id: purchaseId,
            domain,
            auto_refund_reason: 'porkbun_register_failed',
          },
        })
        refundIssued = true
      } catch (re: any) {
        refundError = re?.message || String(re)
      }
    }
    await supabase
      .from('domain_purchases')
      .update({
        status: refundIssued ? 'refunded' : 'failed',
        error_message:
          `porkbun_register: ${err.message}` +
          (refundIssued ? ' · auto-refunded' :
           refundError ? ` · refund failed: ${refundError}` : ''),
      })
      .eq('id', purchaseId)
    await logEvent(supabase, meta.user_id, 'domain_purchase.register_failed', {
      domain, purchase_id: purchaseId,
      error: err.message,
      auto_refunded: refundIssued,
      refund_error: refundError,
    })
    return
  }

  // 2. DNS records at Porkbun → point at Vercel.
  //    Errors here are recoverable — domain is registered, we just
  //    need the DNS later. Surface but don't abort the attach.
  const dnsErrors: string[] = []
  try {
    await createDnsRecord(domain, { name: '', type: 'A', content: VERCEL_APEX_A, ttl: 600 })
  } catch (e: any) {
    dnsErrors.push(`A: ${e?.message || e}`)
  }
  try {
    await createDnsRecord(domain, { name: 'www', type: 'CNAME', content: VERCEL_CNAME_TARGET, ttl: 600 })
  } catch (e: any) {
    dnsErrors.push(`CNAME www: ${e?.message || e}`)
  }

  // 3. Attach to Vercel project so SSL provisions.
  let vercelDomainId: string | null = null
  try {
    const v = await addDomainToProject(domain)
    vercelDomainId = v?.name || null
  } catch (e: any) {
    await supabase
      .from('domain_purchases')
      .update({
        status: 'failed',
        error_message: `vercel_attach: ${e?.message || e}${dnsErrors.length ? ` | dns: ${dnsErrors.join('; ')}` : ''}`,
      })
      .eq('id', purchaseId)
    await logEvent(supabase, meta.user_id, 'domain_purchase.vercel_attach_failed', {
      domain, purchase_id: purchaseId, error: e?.message,
    })
    return
  }

  // 4. Record in the existing `domains` table so SiteCard / DomainsList
  //    pick it up. Use upsert so a retry doesn't duplicate the row.
  if (themeId) {
    await supabase.from('domains').upsert(
      {
        user_id: meta.user_id,
        theme_id: themeId,
        domain,
        vercel_domain_id: vercelDomainId,
        status: 'pending_ssl',
      },
      { onConflict: 'domain' }
    )
  }

  // 5. Compute expiry and flip to active.
  const expiresAt = new Date()
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + years)

  await supabase
    .from('domain_purchases')
    .update({
      status: 'active',
      registered_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      error_message: dnsErrors.length ? `dns_partial: ${dnsErrors.join('; ')}` : null,
    })
    .eq('id', purchaseId)

  await logEvent(supabase, meta.user_id, 'domain_purchase.completed', {
    domain,
    purchase_id: purchaseId,
    years,
    theme_id: themeId,
    vercel_domain_id: vercelDomainId,
  })

  // Thank-you / "your domain is live" email. Best-effort — the registration
  // already succeeded, so a mail failure must never fail the webhook.
  const buyerEmail =
    session.customer_details?.email || session.customer_email || null
  if (buyerEmail) {
    try {
      const tmpl = domainPurchasedEmail({
        domain,
        years,
        expiresAt: expiresAt.toISOString(),
        manageUrl: 'https://zenyaai.co/dashboard/sites',
      })
      await sendEmail({
        to: buyerEmail,
        subject: tmpl.subject,
        text: tmpl.text,
        html: tmpl.html,
        tags: [{ name: 'type', value: 'domain_purchased' }],
      })
    } catch (e) {
      console.error('[webhook] domain purchase email failed (non-fatal):', e)
    }
  }
}

/**
 * Handle a paid renewal session. Bumps the existing domain_purchases
 * row's expires_at by N years and updates retail/wholesale totals.
 *
 * Doesn't call any Porkbun renew endpoint — Porkbun's public JSON API
 * doesn't expose one. The Porkbun-side renewal is handled by their
 * auto-renew (which we leave on by default for every Zenya-managed
 * domain). When auto-renew fires, it'll debit our balance at wholesale
 * — by which point we've already collected this retail charge.
 */
async function fulfillDomainRenewal(
  supabase: Admin,
  session: Stripe.Checkout.Session,
  meta: { domain_purchase_id: string; domain: string; years: string }
) {
  const purchaseId = meta.domain_purchase_id
  const years = Math.max(1, Math.min(10, Number(meta.years) || 1))
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null
  const amountUsd = (session.amount_total ?? 0) / 100

  const { data: existing } = await supabase
    .from('domain_purchases')
    .select('id, user_id, domain, status, expires_at, retail_usd_charged, wholesale_usd')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!existing) {
    console.error('[webhook] renewal: purchase row missing for', purchaseId)
    return
  }

  // Bump expiry from whichever is later — today, or the current
  // expires_at — so renewing 60 days early adds a full year on top
  // instead of resetting the clock.
  const baseTime = Math.max(
    Date.now(),
    existing.expires_at ? new Date(existing.expires_at as any).getTime() : 0
  )
  const newExpiry = new Date(baseTime)
  newExpiry.setUTCFullYear(newExpiry.getUTCFullYear() + years)

  const wholesaleAdded = Number((session.metadata?.wholesale_usd as string) || '0') || 0
  const retailAdded = Number((session.metadata?.retail_usd as string) || '0') || amountUsd

  await supabase
    .from('domain_purchases')
    .update({
      expires_at: newExpiry.toISOString(),
      retail_usd_charged: +((Number(existing.retail_usd_charged) || 0) + retailAdded).toFixed(2),
      wholesale_usd: +((Number(existing.wholesale_usd) || 0) + wholesaleAdded).toFixed(2),
      // Renewing brings a failed/refunded row back to life only if
      // explicitly intended; we just leave the status untouched here
      // for the common active → active case.
    })
    .eq('id', purchaseId)

  await logEvent(supabase, existing.user_id, 'domain_purchase.renewed', {
    purchase_id: purchaseId,
    domain: existing.domain,
    years,
    new_expires_at: newExpiry.toISOString(),
    payment_intent_id: paymentIntentId,
    retail_added_usd: retailAdded,
  })
}

// ---------- POST handler --------------------------------------------------

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!secret) {
    return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 500 })
  }

  const buf = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = admin()

  // Idempotency.
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id, processed')
    .eq('id', event.id)
    .maybeSingle()

  if (existing?.processed) {
    return NextResponse.json({ ok: true, idempotent: true })
  }
  if (!existing) {
    await supabase
      .from('stripe_events')
      .insert({ id: event.id, type: event.type, payload: event as any, processed: false })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = (session.client_reference_id as string | null) || null
        const customerId =
          typeof session.customer === 'string' ? session.customer : null
        const email =
          session.customer_details?.email || session.customer_email || null

        if (customerId) await linkStripeCustomer(supabase, customerId, email, userId)

        // Branch: a domain registration runs through the same Stripe
        // Checkout endpoint as a one-time pro purchase. We tell them
        // apart by metadata.purchase_type — set in /api/domains/purchase.
        const purchaseType = (session.metadata?.purchase_type as string | undefined) || ''

        if (
          session.mode === 'payment' &&
          session.payment_status === 'paid' &&
          purchaseType === 'domain'
        ) {
          await fulfillDomainPurchase(supabase, session, {
            domain_purchase_id: (session.metadata?.domain_purchase_id as string) || '',
            user_id: (session.metadata?.user_id as string) || userId || '',
            domain: (session.metadata?.domain as string) || '',
            years: (session.metadata?.years as string) || '1',
            theme_id: (session.metadata?.theme_id as string) || '',
          })
        } else if (
          session.mode === 'payment' &&
          session.payment_status === 'paid' &&
          purchaseType === 'domain_renew'
        ) {
          await fulfillDomainRenewal(supabase, session, {
            domain_purchase_id: (session.metadata?.domain_purchase_id as string) || '',
            domain: (session.metadata?.domain as string) || '',
            years: (session.metadata?.years as string) || '1',
          })
        } else if (session.mode === 'payment' && session.payment_status === 'paid' && userId) {
          await recordOneTimePurchase(supabase, session, userId)
        } else if (session.mode === 'subscription' && typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          await upsertHostingSubscription(supabase, sub, userId)

          // First-activation welcome email. This branch only fires on the
          // initial subscription checkout — renewals/updates come through
          // invoice.* and customer.subscription.* events — so it won't spam.
          if (email) {
            try {
              const tmpl = planPurchasedEmail({ plan: 'hosting', manageUrl: 'https://zenyaai.co/dashboard' })
              await sendEmail({
                to: email,
                subject: tmpl.subject,
                text: tmpl.text,
                html: tmpl.html,
                tags: [{ name: 'type', value: 'plan_hosting' }],
              })
            } catch (e) {
              console.error('[webhook] hosting welcome email failed (non-fatal):', e)
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertHostingSubscription(supabase, sub)
        break
      }

      case 'customer.created':
      case 'customer.updated': {
        const c = event.data.object as Stripe.Customer
        await linkStripeCustomer(
          supabase,
          c.id,
          c.email || null,
          (c.metadata?.user_id as string | undefined) || null
        )
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await recordRefund(supabase, charge)
        break
      }

      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice
        const subId = (inv as any).subscription
        if (typeof subId === 'string') {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertHostingSubscription(supabase, sub)
        }
        break
      }
    }

    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', event.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    await supabase
      .from('stripe_events')
      .update({ error: err?.message || String(err) })
      .eq('id', event.id)
    return NextResponse.json({ error: 'processing_error', details: err?.message }, { status: 500 })
  }
}
