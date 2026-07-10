import { ReactNode, Suspense } from 'react';
import Script from 'next/script';
import { ShopifyAppBridge } from '@/components/ShopifyAppBridge';

export default function ShopifyLayout({ children }: { children: ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY || '';

  return (
    <>
      {/* App Bridge script — head.tsx was dropped in Next.js 14 so we
          inject it here with next/script. Without this, window.shopify
          is undefined and every authenticatedFetch call throws
          "App Bridge is not available". */}
      {apiKey && (
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={apiKey}
          strategy="beforeInteractive"
        />
      )}
      <Suspense fallback={null}>
        <ShopifyAppBridge apiKey={apiKey}>
          {children}
        </ShopifyAppBridge>
      </Suspense>
    </>
  );
}
