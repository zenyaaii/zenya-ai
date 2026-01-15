import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export async function POST(req: NextRequest) {
  const topic = req.headers.get('x-shopify-topic') || '';
  const shop = req.headers.get('x-shopify-shop-domain') || '';
  
  // Note: We need the raw body for HMAC validation.
  // In Next.js App Router, req.text() consumes the body.
  const rawBody = await req.text();

  try {
    const validationResult = await shopify.webhooks.validate({
      rawBody: rawBody,
      rawRequest: req,
    });

    if (!validationResult.valid) {
      console.error(`Webhook validation failed: ${validationResult.reason}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch (error) {
    console.error('Webhook validation error:', error);
    return NextResponse.json({ error: 'Validation error' }, { status: 400 });
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
