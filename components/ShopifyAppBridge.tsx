'use client';

import { useSearchParams } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import Script from 'next/script';

export function ShopifyAppBridge({ 
  children, 
  apiKey 
}: { 
  children: ReactNode;
  apiKey: string;
}) {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!host) {
    // If accessed directly without host, prompt to install or login
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

  return (
    <>
      <Script 
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js" 
        // @ts-ignore
        data-api-key={apiKey} 
      />
      {children}
    </>
  );
}
