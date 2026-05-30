'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function ThemesDashboardContent() {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Themes</h1>
            <p className="text-slate-600 mt-2">Manage your AI-generated themes</p>
          </div>
          <div className="flex gap-4">
            <Link 
              href={`/app?host=${host}&shop=${shop}`}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
            <Link 
              href={`/app/create?host=${host}&shop=${shop}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              + New Theme
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🎨
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Download your theme zip</h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Create a theme and download the zip from the preview page. Then upload it in Shopify: Online Store → Themes → Add theme → Upload zip file.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ThemesDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>}>
      <ThemesDashboardContent />
    </Suspense>
  );
}
