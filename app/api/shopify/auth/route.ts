import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');
  const returnTo = req.nextUrl.searchParams.get('returnTo');
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const cleanShop = shopify.utils.sanitizeShop(shop, true);
  if (!cleanShop) {
    return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 });
  }

  try {
    const beginResponse = await shopify.auth.begin({
      shop: cleanShop,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    const location = beginResponse.headers.get('location') || beginResponse.headers.get('Location');
    if (!location) {
      return NextResponse.json({ error: 'Auth start failed: missing redirect location' }, { status: 500 });
    }

    const response = NextResponse.redirect(location, { status: beginResponse.status });

    if (returnTo && returnTo.startsWith('/')) {
      response.cookies.set('zenya_return_to', returnTo, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 10,
      });
    }

    return response;
  } catch (error) {
    console.error('Shopify Auth Error:', error);
    return NextResponse.json({ error: 'Failed to initiate auth', details: String(error) }, { status: 500 });
  }
}
