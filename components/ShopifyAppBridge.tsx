'use client';

import { useSearchParams } from 'next/navigation';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ShopifyBridgeContextValue = {
  apiKey: string;
  host: string;
  getSessionToken: () => Promise<string>;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const ShopifyBridgeContext = createContext<ShopifyBridgeContextValue | null>(null);

export function useShopifyBridge() {
  const ctx = useContext(ShopifyBridgeContext);
  if (!ctx) throw new Error('useShopifyBridge must be used within ShopifyAppBridge');
  return ctx;
}

export function ShopifyAppBridge({ 
  children, 
  apiKey 
}: { 
  children: ReactNode;
  apiKey: string;
}) {
  const searchParams = useSearchParams();
  const host = searchParams.get('host') || '';
  const shop = searchParams.get('shop') || '';
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const createApp = useCallback(() => {
    const AppBridge = (window as any)['app-bridge'];
    const createAppFn = AppBridge?.default;
    if (!createAppFn) return null;
    return createAppFn({
      apiKey,
      host,
      ...(shop ? { shop, shopOrigin: shop } : {}),
      forceRedirect: true,
    });
  }, [apiKey, host, shop]);

  const getSessionToken = useCallback(async () => {
    const shopifyGlobal = (window as any).shopify;
    if (shopifyGlobal && typeof shopifyGlobal.idToken === 'function') {
      const token = await shopifyGlobal.idToken();
      if (!token) throw new Error('Failed to get session token');
      return token;
    }

    const app = createApp();
    if (!app) throw new Error('App Bridge is not available');

    const maybeUtils = (window as any)['app-bridge-utils'];
    if (maybeUtils && typeof maybeUtils.getSessionToken === 'function') {
      const token = await maybeUtils.getSessionToken(app);
      if (!token) throw new Error('Failed to get session token');
      return token;
    }

    return await new Promise<string>((resolve, reject) => {
      let done = false;
      const unsubscribe = app.subscribe((action: any) => {
        if (!action || typeof action.type !== 'string') return;
        if (action.type === 'APP::SESSION_TOKEN_RESPOND') {
          done = true;
          try {
            unsubscribe?.();
          } catch {}
          const token = action?.payload?.sessionToken || action?.payload?.token;
          if (!token) {
            reject(new Error('Missing session token'));
            return;
          }
          resolve(String(token));
          return;
        }
        if (action.type === 'APP::ERROR::FAILED_AUTHENTICATION') {
          done = true;
          try {
            unsubscribe?.();
          } catch {}
          reject(new Error('Failed authentication'));
        }
      });

      try {
        app.dispatch({ type: 'APP::SESSION_TOKEN_REQUEST' });
      } catch (e) {
        try {
          unsubscribe?.();
        } catch {}
        reject(e);
        return;
      }

      window.setTimeout(() => {
        if (done) return;
        try {
          unsubscribe?.();
        } catch {}
        reject(new Error('Session token request timed out'));
      }, 10000);
    });
  }, [createApp]);

  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = await getSessionToken();
      const headers = new Headers(init?.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
    [getSessionToken]
  );

  useEffect(() => {
    try {
      const w = window as any;
      w.__zenyaShopifyGetSessionToken = getSessionToken;
      w.__zenyaShopifyAuthenticatedFetch = authenticatedFetch;
    } catch {}
  }, [authenticatedFetch, getSessionToken]);
  const value = useMemo<ShopifyBridgeContextValue>(
    () => ({ apiKey, host, getSessionToken, authenticatedFetch }),
    [apiKey, host, authenticatedFetch, getSessionToken]
  );

  if (!mounted) return null;

  if (!apiKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Zenya AI Shopify App</h1>
          <p className="mb-4">Missing SHOPIFY_API_KEY configuration.</p>
        </div>
      </div>
    );
  }

  if (!host && !shop) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Zenya AI Shopify App</h1>
          <p className="mb-4">Please open this app from your Shopify Admin.</p>
          <form action="/api/shopify/auth" method="GET">
            <input 
              name="shop" 
              placeholder="my-store.myshopify.com" 
              className="border p-2 rounded mr-2"
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded">Install</button>
          </form>
        </div>
      </div>
    );
  }

  return <ShopifyBridgeContext.Provider value={value}>{children}</ShopifyBridgeContext.Provider>;
}
