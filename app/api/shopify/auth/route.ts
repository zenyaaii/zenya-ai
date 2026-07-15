import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

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
    // shopify.auth.begin() sets a SIGNED `shopify_app_state` cookie on the
    // Response it returns, then 302-redirects to Shopify's OAuth screen.
    // The callback validates that cookie against the `state` query param
    // Shopify echoes back. If the cookie never reaches the browser, the
    // callback throws `CookieNotFound` → the 500 "Auth callback failed"
    // the user saw on *every* connect / theme upload.
    //
    // The previous code created a *fresh* `NextResponse.redirect(location)`
    // and returned that, silently dropping every Set-Cookie header the
    // library had just written. We now return the library's response
    // verbatim so its state cookie (and its `.sig` companion) survive.
    const beginResponse = await shopify.auth.begin({
      shop: cleanShop,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    if (!beginResponse.headers.get('location') && !beginResponse.headers.get('Location')) {
      return NextResponse.json({ error: 'Auth start failed: missing redirect location' }, { status: 500 });
    }

    // Remember where to send the user after the callback completes. This
    // cookie rides alongside Shopify's own OAuth cookie on the same
    // response, so appending (not replacing) preserves the state cookie.
    if (returnTo && returnTo.startsWith('/')) {
      const secure = process.env.NODE_ENV === 'production';
      beginResponse.headers.append(
        'Set-Cookie',
        `zenya_return_to=${encodeURIComponent(returnTo)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
      );
    }

    return beginResponse;
  } catch (error) {
    console.error('Shopify Auth Error:', error);
    return NextResponse.json({ error: 'Failed to initiate auth', details: String(error) }, { status: 500 });
  }
}
