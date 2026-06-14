'use client';

import { TitleBar } from '@shopify/app-bridge-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { generateShopifyTheme } from '@/utils/shopify-generator';
import { saveAs } from 'file-saver';

function DashboardContent() {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');
  const queryString = `?host=${host}&shop=${shop}`;
  
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<any[]>([]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchThemes();
      } else {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  async function fetchThemes() {
    setLoading(true);
    try {
      const r = await fetch('/api/themes');
      if (r.ok) {
        const j = await r.json();
        setThemes(j.themes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created! Please check your email to confirm.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setUser(data.user);
        fetchThemes();
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleDownload(theme: any) {
    setDownloadingId(theme.id);
    try {
      const blob = await generateShopifyTheme(
        theme.product_name,
        theme.content,
        theme.colors,
        theme.images || []
      );
      const fileName = `${String(theme.product_name || 'zenya-theme').toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`;
      saveAs(blob, fileName);
    } catch (e) {
      console.error(e);
      alert('Download failed.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Zenya AI</h1>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? 'Create an account to save your themes' : 'Sign in to access your themes'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                required 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                required 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {authLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-indigo-600 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TitleBar title="Dashboard" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your store builder</h1>
            <p className="mt-2 text-gray-600">Generate a one-product theme and install it — plus the product — straight into this store.</p>
          </div>
          <Link
            href={`/shopify/new${queryString}`}
            className="rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700"
          >
            + Create &amp; install a store
          </Link>
        </div>
        
        {themes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
               ✨
             </div>
             <h3 className="mb-2 text-lg font-bold text-gray-900">Build your first store</h3>
             <p className="mx-auto mb-6 max-w-md text-gray-500">
               Paste an AliExpress product link and Zenya generates the theme, imports real reviews, and installs the
               theme + product into this store — no zip uploads.
             </p>
             <Link
               href={`/shopify/new${queryString}`}
               className="inline-block rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-700"
             >
               + Create &amp; install a store
             </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {themes.map(t => (
              <div key={t.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-indigo-100" />
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{t.product_name}</h3>
                  <div className="mt-6 flex gap-3">
                    <Link 
                        href={`/preview/${t.id}${queryString}`}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Preview
                    </Link>
                    <button 
                        onClick={() => handleDownload(t)}
                        disabled={downloadingId === t.id}
                        className="flex-1 rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {downloadingId === t.id ? '...' : 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopifyDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
