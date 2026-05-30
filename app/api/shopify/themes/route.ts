import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { createShopifyProduct, upsertProductMetafield } from '@/utils/shopify';

export const maxDuration = 60; // 60 seconds max duration (Vercel Pro, but helps on Hobby sometimes)

export async function OPTIONS() {
  return new NextResponse(null, { 
      status: 200, 
      headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      } 
  });
}

export async function GET() {
  return NextResponse.json({ message: 'Shopify publish API is working. Use POST to create a product and store design data.' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let shop = body?.shop;
    const themeData =
      body?.themeData ||
      (body?.productName
        ? {
            productName: body.productName,
            price: body.price,
            originalPrice: body.originalPrice,
            description: body.description,
            images: body.images,
            vendor: body.vendor,
            content: body.content,
            colors: body.colors,
          }
        : null);
    
    const authorization = req.headers.get('authorization') || '';
    const bearer = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
    if (bearer) {
      try {
        const payload = await shopify.session.decodeSessionToken(bearer);
        const dest = typeof payload?.dest === 'string' ? payload.dest : '';
        const tokenShop = dest.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (tokenShop) {
          if (!shop) shop = tokenShop;
          if (shop && tokenShop && shop !== tokenShop) {
            return NextResponse.json(
              { error: 'Shop mismatch', code: 'SHOP_MISMATCH' },
              { status: 401 }
            );
          }
        }
      } catch (e: any) {
        return NextResponse.json(
          {
            error: 'Invalid session token. Please reconnect the app.',
            code: 'INVALID_SESSION_TOKEN',
            authUrl: shop ? `/api/shopify/auth?shop=${encodeURIComponent(shop)}` : undefined,
          },
          { status: 401 }
        );
      }
    }

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }
    if (!themeData || !themeData.productName) {
      return NextResponse.json({ error: 'Missing themeData' }, { status: 400 });
    }

    // Use the configured session storage (Prisma or File)
    let sessions: any[] = [];
    try {
      sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : String(e);
      const looksLikeMissingTable =
        message.includes('relation "Session" does not exist') ||
        message.includes('The table `public.Session` does not exist') ||
        message.includes('Prisma session table does not exist') ||
        message.includes('P2021');
      const looksLikeDbAuth =
        message.includes('FATAL: Tenant or user not found') ||
        message.includes('Tenant or user not found');

      return NextResponse.json(
        {
          error: looksLikeMissingTable
            ? 'Session table is missing in the database. Run Prisma to create it (or create it in Supabase SQL editor).'
            : looksLikeDbAuth
              ? 'Database login failed. Your Vercel DATABASE_URL / DIRECT_URL are wrong (or include quotes). Copy them again from Supabase and redeploy.'
              : 'Failed to access session storage',
          code: looksLikeMissingTable
            ? 'SESSION_TABLE_MISSING'
            : looksLikeDbAuth
              ? 'DATABASE_AUTH_FAILED'
              : 'SESSION_STORAGE_ERROR',
          details: message,
        },
        { status: 500 }
      );
    }
    
    if (sessions.length === 0) {
      return NextResponse.json(
        {
          error: 'No session found for shop',
          code: 'NO_SESSION',
          authUrl: `/api/shopify/auth?shop=${encodeURIComponent(shop)}`,
        },
        { status: 401 }
      );
    }

    const session = sessions[0];

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error: 'No access token found for session',
          code: 'NO_ACCESS_TOKEN',
          authUrl: `/api/shopify/auth?shop=${encodeURIComponent(shop)}`,
        },
        { status: 401 }
      );
    }

    const createdProduct = await createShopifyProduct(shop, session.accessToken, {
      name: themeData.productName,
      description: themeData.description || themeData.content?.hero?.subheadline || 'AI Generated Product',
      images: themeData.images || [],
      price: Number(themeData.price) || 49.99,
      originalPrice: Number(themeData.originalPrice) || 99.99,
      vendor: themeData.vendor || 'Zenya',
    });

    const designPayload = {
      version: 1,
      colors: themeData.colors || { primary: '#4f46e5', secondary: '#06b6d4' },
      content: themeData.content || null,
      images: themeData.images || [],
      price: Number(themeData.price) || 49.99,
      originalPrice: Number(themeData.originalPrice) || 99.99,
      generatedAt: new Date().toISOString(),
    };

    await upsertProductMetafield({
      shop,
      accessToken: session.accessToken,
      productId: createdProduct.id,
      namespace: 'zenya',
      key: 'design',
      type: 'json',
      value: designPayload,
    });

    const productHandle = (createdProduct as any)?.handle || null;
    const adminProductUrl = `https://${shop}/admin/products/${createdProduct.id}`;
    const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;
    const storefrontUrl = productHandle ? `https://${shop}/products/${productHandle}` : null;

    return NextResponse.json({
      success: true,
      productId: createdProduct.id,
      productHandle,
      adminProductUrl,
      themeEditorUrl,
      storefrontUrl,
      nextSteps: [
        { label: 'Open product', url: adminProductUrl },
        { label: 'Open theme editor', url: themeEditorUrl },
      ],
    });

  } catch (error) {
    console.error('Failed to publish to Shopify:', error);
    return NextResponse.json({ error: 'Failed to publish to Shopify', details: String(error) }, { status: 500 });
  }
}
