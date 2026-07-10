import { ReactNode, Suspense } from 'react';
import { ShopifyAppBridge } from '@/components/ShopifyAppBridge';

// The App Bridge <script> tag is injected in the ROOT layout (app/layout.tsx)
// for /shopify/* paths — it must be the first <script> in <head> with no
// async/defer, which next/script and nested layouts can't guarantee.

export default function ShopifyLayout({ children }: { children: ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY || '';

  return (
    <Suspense fallback={null}>
      <ShopifyAppBridge apiKey={apiKey}>
        {children}
      </ShopifyAppBridge>
    </Suspense>
  );
}
