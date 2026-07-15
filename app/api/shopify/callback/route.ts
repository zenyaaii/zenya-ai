import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
  const baseUrl = (process.env.VERCEL_URL && !isProduction)
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.SHOPIFY_APP_URL || req.nextUrl.origin);

  try {
    const { session, headers } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    console.log('Shopify session created for:', session.shop);

    // Session is automatically stored by shopify.auth.callback via the configured sessionStorage
    // (See lib/shopify.ts)

    // Bind the shop to the Zenya user who ran the OAuth flow (their
    // Supabase cookies ride along on this browser redirect). This is
    // what authorizes /api/build/publish for the shop. Embedded-app
    // installs without a Zenya session just skip the binding.
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && session?.shop) {
        await supabase
          .from('shopify_connections')
          .upsert({ user_id: user.id, shop: session.shop }, { onConflict: 'user_id,shop' });
      }
    } catch (e) {
      console.warn('shopify_connections upsert skipped:', e);
    }

    // Redirect to app home (Embedded App)
    const host = req.nextUrl.searchParams.get('host');

    const returnToCookie = req.cookies.get('zenya_return_to')?.value;
    const target = new URL(returnToCookie && returnToCookie.startsWith('/') ? returnToCookie : '/shopify', baseUrl);
    if (session?.shop && !target.searchParams.get('shop')) target.searchParams.set('shop', session.shop);
    if (host && !target.searchParams.get('host')) target.searchParams.set('host', host);

    const res = NextResponse.redirect(target.toString());

    // Forward the library's Set-Cookie headers (it clears the one-time
    // `shopify_app_state` cookie now that OAuth is complete). Without this
    // the state cookie lingers until its 60s expiry — harmless but untidy.
    if (headers) {
      const setCookies = typeof (headers as Headers).getSetCookie === 'function'
        ? (headers as Headers).getSetCookie()
        : [];
      for (const c of setCookies) res.headers.append('set-cookie', c);
    }

    if (returnToCookie) {
      res.cookies.set('zenya_return_to', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      });
    }

    return res;
  } catch (error) {
    console.error('Shopify Callback Error:', error);
    // Send the user somewhere human instead of a raw JSON 500. The build
    // page reads ?shopify_error and shows a "try connecting again" notice;
    // the polling connection check keeps working either way.
    const errUrl = new URL('/build', baseUrl);
    errUrl.searchParams.set('shopify_error', 'auth_callback_failed');
    return NextResponse.redirect(errUrl.toString());
  }
}
