import { ReactNode, Suspense } from 'react';
import { ShopifyAppBridge } from '@/components/ShopifyAppBridge';

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
