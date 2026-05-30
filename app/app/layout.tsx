import { ReactNode, Suspense } from 'react';
import { ShopifyAppBridge } from '@/components/ShopifyAppBridge';

export default function AppLayout({ children }: { children: ReactNode }) {
  const apiKey = process.env.SHOPIFY_API_KEY || '';

  return (
    <Suspense fallback={null}>
      <ShopifyAppBridge apiKey={apiKey}>
        <div className="shopify-app-container">{children}</div>
      </ShopifyAppBridge>
    </Suspense>
  );
}
