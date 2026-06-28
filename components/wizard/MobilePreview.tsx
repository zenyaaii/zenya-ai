'use client';

import { useCallback, useEffect, useRef } from 'react';

interface MobilePreviewProps {
  name: string;
  price: string | number;
  originalPrice: string | number;
  images: string[];
  primary: string;
  secondary: string;
  content: any;
  shopName: string;
  iframeId?: string;
  mode?: 'product' | 'full';
  lockToProduct?: boolean;
}

export default function MobilePreview({
  name,
  price,
  originalPrice,
  images,
  primary,
  secondary,
  content,
  shopName,
  iframeId = 'preview-frame',
  mode = 'product',
  lockToProduct = false
}: MobilePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Single source of truth for the message we send into the iframe. Kept in a
  // ref so the PREVIEW_READY listener always posts the latest data without
  // re-subscribing on every prop change.
  const buildPayload = useCallback(() => ({
    name,
    price: parseFloat(price.toString()) || 49.99,
    originalPrice: parseFloat(originalPrice.toString()) || 99.99,
    images,
    primary,
    secondary,
    content,
    shopName,
    mode,
    lockToProduct,
  }), [name, price, originalPrice, images, primary, secondary, content, shopName, mode, lockToProduct]);

  const payloadRef = useRef(buildPayload());
  payloadRef.current = buildPayload();

  const post = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'UPDATE_PREVIEW', payload: payloadRef.current },
      '*'
    );
  }, []);

  // Push fresh data whenever props change.
  useEffect(() => { post(); }, [post, buildPayload]);

  // The iframe announces PREVIEW_READY once its own message listener is wired.
  // Without responding here, a race let the iframe keep rendering its default
  // placeholder theme — which looked like "a completely different theme" on
  // mobile. Re-post on that signal so the real theme always lands.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') post();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  return (
    <div className="sticky top-24 mx-auto w-[375px] overflow-hidden rounded-[3rem] border-[8px] border-gray-900 bg-white shadow-2xl ring-1 ring-black/5">
      {/* Mobile Status Bar Mockup */}
      <div className="bg-white px-6 py-3 flex justify-between items-center text-[10px] font-bold text-gray-900 border-b border-gray-50">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
            <div className="h-2.5 w-4 rounded-[2px] border border-gray-900" />
          </div>
      </div>

      {/* Address Bar (Mobile Style) */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 rounded-lg bg-gray-200/50 px-3 py-1.5 text-[10px] text-gray-500">
            <span>🔒</span>
            <span className="truncate flex-1 text-center">{(shopName || 'store').replace(/\s+/g, '').toLowerCase()}.com</span>
        </div>
      </div>

      {/* Store Preview Iframe */}
      <div className="h-[600px] bg-white relative">
        <iframe 
          ref={iframeRef}
          id={iframeId}
          src="/preview/live"
          className="w-full h-full border-none"
          title="Live Preview"
          onLoad={post}
        />
      </div>
      
      {/* Home Indicator */}
      <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-900/20" />
    </div>
  );
}
