'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AppHome() {
  const [host, setHost] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const hostParam = url.searchParams.get('host');
      const shopParam = url.searchParams.get('shop');
      if (hostParam) setHost(hostParam);
      if (shopParam) setShop(shopParam);
    }
  }, []);

  const queryParams = new URLSearchParams();
  if (host) queryParams.set('host', host);
  if (shop) queryParams.set('shop', shop);
  const queryString = queryParams.toString();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Trust Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-center gap-2">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-slate-600">
          <span className="text-green-600 font-bold">✓ Connected</span> Your store is securely linked to Zenya AI inside Shopify Admin.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Welcome to Your Growth Engine</h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Create high-converting landing pages in seconds, directly from your product URLs. 
            Build trust, increase conversions, and scale your brand with Zenya AI.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Link 
              href={`/app/create?${queryString}`}
              className="flex flex-col items-center p-8 border-2 border-slate-100 rounded-xl hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg transition group bg-white"
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-200 transition">
                <span className="text-4xl">🚀</span>
              </div>
              <span className="font-bold text-slate-900 text-xl">Launch New Theme</span>
              <span className="text-sm text-slate-500 mt-2">Start the step-by-step wizard</span>
            </Link>

            <Link 
              href={`/dashboard/themes?${queryString}`}
              className="flex flex-col items-center p-8 border-2 border-slate-100 rounded-xl hover:border-purple-600 hover:bg-purple-50 hover:shadow-lg transition group bg-white"
            >
               <div className="bg-purple-100 p-4 rounded-full mb-4 group-hover:bg-purple-200 transition">
                <span className="text-4xl">🎨</span>
              </div>
              <span className="font-bold text-slate-900 text-xl">My Themes</span>
              <span className="text-sm text-slate-500 mt-2">Manage your generated themes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
