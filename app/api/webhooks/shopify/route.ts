import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import crypto from 'crypto';

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
  if (digestBuf.length !== headerBuf.length || !crypto.timingSafeEqual(digestBuf, headerBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log(`[Webhook] Received ${topic} for ${shop}`);

  // Handle GDPR Mandatory Webhooks
  switch (topic) {
    case 'customers/data_request':
      // Return 200 immediately
      // Logic: Send email to merchant with customer data (if we stored any PII outside Shopify)
      // Zenya stores minimal PII (email in Supabase), so we might need to handle this.
      console.log(`[GDPR] Customer Data Request for ${shop}`);
      break;

    case 'customers/redact':
      // Logic: Delete customer data from Supabase
      console.log(`[GDPR] Customer Redact for ${shop}`);
      break;

    case 'shop/redact':
      // Logic: Delete shop data (themes, sessions)
      console.log(`[GDPR] Shop Redact for ${shop}`);
      // In a real app, we would delete the shop's session and data from DB
      break;
      
    case 'app/uninstalled':
      // Clean up session
      console.log(`[Webhook] App Uninstalled for ${shop}`);
      break;
  }

  return NextResponse.json({ success: true });
}
