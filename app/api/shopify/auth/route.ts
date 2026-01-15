import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const cleanShop = shopify.utils.sanitizeShop(shop, true);
  if (!cleanShop) {
    return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 });
  }

  try {
    const response = await shopify.auth.begin({
      shop: cleanShop,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    return response;
  } catch (error) {
    console.error('Shopify Auth Error:', error);
    return NextResponse.json({ error: 'Failed to initiate auth' }, { status: 500 });
  }
}
