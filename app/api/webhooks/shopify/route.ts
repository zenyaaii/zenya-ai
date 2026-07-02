import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-shopify-topic') || '';
  const shop = req.headers.get('x-shopify-shop-domain') || '';

  const secret = process.env.SHOPIFY_API_SECRET || '';
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';
  const buf = Buffer.from(await req.arrayBuffer());

  if (!secret || !hmacHeader) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const digest = crypto.createHmac('sha256', secret).update(buf).digest('base64');
  const digestBuf = Buffer.from(digest, 'base64');
  const headerBuf = Buffer.from(hmacHeader, 'base64');
  if (
    digestBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(digestBuf, headerBuf)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log(`[Webhook] Received ${topic} for ${shop}`);

  try {
    switch (topic) {
      case 'customers/data_request': {
        // Zenya doesn't store Shopify customer PII directly. We log the request
        // and respond 200; if we ever start storing Shopify customer data we'd
        // gather and email it to the merchant here.
        console.log(`[GDPR] customers/data_request for ${shop}`);
        break;
      }

      case 'customers/redact': {
        // We don't store any Shopify customer PII; nothing to delete.
        console.log(`[GDPR] customers/redact for ${shop} (no-op, no PII stored)`);
        break;
      }

      case 'shop/redact':
      case 'app/uninstalled': {
        // Wipe everything tied to this shop: stored Shopify sessions AND the
        // shop→account link. Removing the link means the theme app extension's
        // license check (/app/license) can no longer resolve an active
        // subscription for this shop, so the premium Zenya content degrades to
        // its "reconnect to restore" state. (Themes & generated content live
        // under Zenya user accounts, not shop accounts, so they're untouched.)
        if (shop) {
          try {
            const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
            if (sessions.length) {
              await shopify.config.sessionStorage.deleteSessions(sessions.map((s) => s.id));
              console.log(`[Webhook] Removed ${sessions.length} session(s) for ${shop}`);
            }
          } catch (err) {
            console.error(`[Webhook] Failed cleaning sessions for ${shop}:`, err);
          }
          try {
            const { error } = await admin()
              .from('shopify_connections')
              .delete()
              .eq('shop', shop);
            if (error) throw error;
            console.log(`[Webhook] Removed shop→account link(s) for ${shop}`);
          } catch (err) {
            console.error(`[Webhook] Failed removing connection for ${shop}:`, err);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled topic ${topic}`);
    }
  } catch (err) {
    console.error(`[Webhook] Handler error for ${topic}:`, err);
    // Still return 200 so Shopify doesn't retry storms on transient failures.
  }

  return NextResponse.json({ success: true });
}
