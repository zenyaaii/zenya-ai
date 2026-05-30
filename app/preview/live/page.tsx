'use client';

import { useState, useEffect } from 'react';
import ThemePreview from '@/components/ThemePreview';
import ProductPage from '@/components/theme/ProductPage';
import StoreNavbar from '@/components/theme/StoreNavbar';

// Initial state matching the wizard's defaults
const initialState = {
  name: '',
  price: 49.99,
  originalPrice: 99.99,
  images: [],
  primary: '#4f46e5',
  secondary: '#06b6d4',
  content: null,
  shopName: '',
  mode: 'full', // 'full' | 'product'
  lockToProduct: false
};

export default function LivePreviewPage() {
  const [data, setData] = useState(initialState);

  useEffect(() => {
    // Listen for updates from the parent window
    const handleMessage = (event: MessageEvent) => {
      // Validate origin if necessary, but for same-site it's usually fine
      // if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'UPDATE_PREVIEW') {
        setData(prev => ({ ...prev, ...event.data.payload }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Signal to parent that we are ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Use the passed data
  const { name, price, originalPrice, images, primary, secondary, content, shopName, mode, lockToProduct } = data;

  return (
    <div className="bg-white h-screen w-full overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="w-full max-w-full overflow-hidden">
        <ThemePreview 
          name={name || 'Product Name'}
          images={images}
          primaryColor={primary}
          secondaryColor={secondary}
          content={content}
          price={Number(price) || 49.99}
          originalPrice={Number(originalPrice) || 99.99}
          shopName={shopName}
          initialView={mode === 'product' ? 'product' : 'home'}
          lockToProduct={Boolean(lockToProduct)}
        />
      </div>
    </div>
  );
}
