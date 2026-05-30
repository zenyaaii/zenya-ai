'use client';

import { useState } from 'react';
import MobilePreview from '@/components/wizard/MobilePreview';

interface FullScreenPreviewProps {
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  primary: string;
  secondary: string;
  content: any;
  shopName: string;
}

export default function FullScreenPreview({
  name,
  price,
  originalPrice,
  images,
  primary,
  secondary,
  content,
  shopName
}: FullScreenPreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Device Toggle */}
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setDevice('mobile')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            device === 'mobile'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Mobile
        </button>
        <button
          onClick={() => setDevice('desktop')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            device === 'desktop'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Desktop
        </button>
      </div>

      {/* Preview Area */}
      {device === 'mobile' ? (
        <MobilePreview
          name={name}
          price={price}
          originalPrice={originalPrice}
          images={images}
          primary={primary}
          secondary={secondary}
          content={content}
          shopName={shopName}
          iframeId="preview-frame-final"
        />
      ) : (
        <div className="w-full max-w-[1200px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          {/* Desktop Browser Chrome */}
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1">
                 <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
            </div>
            </div>
            <div className="mx-auto flex h-8 w-full max-w-[600px] items-center justify-center rounded-md bg-white text-xs font-medium text-gray-500 shadow-sm ring-1 ring-black/5">
              {(shopName || 'store').replace(/\s+/g, '').toLowerCase()}.com
            </div>
            <div className="w-20" />
          </div>
          
          <div className="h-[800px] w-full relative">
             <iframe 
                src="/preview/live"
                className="w-full h-full border-none"
                title="Desktop Preview"
                onLoad={(e) => {
                  const iframe = e.currentTarget;
                  iframe.contentWindow?.postMessage({
                    type: 'UPDATE_PREVIEW',
                    payload: {
                      name,
                      price,
                      originalPrice,
                      images,
                      primary,
                      secondary,
                      content,
                      shopName,
                      mode: 'full'
                    }
                  }, '*');
                }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
