'use client';

import { TitleBar } from '@shopify/app-bridge-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ShoppingBag,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Download,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateShopifyTheme } from '@/utils/shopify-generator';
import { saveAs } from 'file-saver';
import AuroraBackground from '@/components/marketing/AuroraBackground';
import { auroraTints } from '@/lib/aurora-tints';
import { themePreview, themePreviewFallback } from '@/lib/theme-previews';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
 * Shopify-installable templates.
 * Only templates that install directly into a Shopify store belong
 * here — hosted-site templates (Atlas, Maison, etc.) live on the web
 * app, not inside Admin. Adding a future Shopify theme is one entry.
 * ──────────────────────────────────────────────────────────────── */
type ShopifyTemplate = {
  id: keyof typeof auroraTints;
  name: string;
  tagline: string;
  description: string;
  sections: number;
  presets: number;
  icon: LucideIcon;
  /** Build wizard route relative to /shopify/new; null = coming soon. */
  type: string | null;
};

const SHOPIFY_TEMPLATES: ShopifyTemplate[] = [
  {
    id: 'one_product',
    name: 'Storefront',
    tagline: 'One-product · Dropshipping',
    description:
      'Conversion-first single-product theme. Hero funnel, sticky add-to-cart, bundles, comparison, FAQ, urgency, real imported reviews, and a fully designed product page — installed straight into this store.',
    sections: 24,
    presets: 3,
    icon: ShoppingBag,
    type: 'one_product',
  },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const host = searchParams.get('host');
  const shop = searchParams.get('shop');
  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (host) qs.set('host', host);
    if (shop) qs.set('shop', shop);
    return qs.toString() ? `?${qs.toString()}` : '';
  }, [host, shop]);

  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<any[]>([]);

  // Login state
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! Please check your email to confirm.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <AuroraBackground fixed intensity={0.7} />
        <div className="relative flex items-center gap-3 text-muted">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#6366f1]" />
          <span className="text-sm font-medium">Loading your studio…</span>
        </div>
      </div>
    );
  }

  /* ── Auth gate ── */
  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AuroraBackground fixed intensity={0.85} />
        <TitleBar title="Zenya AI" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-[28px] border border-token bg-white/80 p-8 shadow-soft-lg backdrop-blur-xl"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1]">
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <h1 className="text-[26px] font-[590] tracking-[-0.6px] text-foreground">
              Welcome to <span className="gradient-text">Zenya AI</span>
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              {isSignUp ? 'Create an account to save your stores.' : 'Sign in to build & install themes into your store.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-token bg-white px-4 py-2.5 text-foreground outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/15"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-token bg-white px-4 py-2.5 text-foreground outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-full bg-foreground py-3 text-[14px] font-semibold text-white shadow-soft-md transition hover:scale-[1.01] disabled:opacity-50"
            >
              {authLoading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-[#6366f1] hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Dashboard: the template gallery ── */
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground fixed intensity={0.8} />
      <TitleBar title="Zenya AI" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-token bg-white/60 px-3 py-1.5 text-[12px] font-medium text-muted backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Every template here installs straight into {shop ? shop.replace('.myshopify.com', '') : 'your store'}
          </div>
          <h1 className="text-[40px] font-[590] leading-[1.06] tracking-[-1.4px] text-foreground sm:text-[52px] sm:tracking-[-2px]">
            Build a <span className="gradient-text">Shopify store</span> in minutes.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.65] text-muted">
            Pick a template, paste a product link, and Zenya writes the copy, imports real
            reviews, designs the page, and installs the theme + product right into this store.
          </p>
        </motion.div>

        {/* Template gallery */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SHOPIFY_TEMPLATES.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} queryString={queryString} />
          ))}
          <ComingSoonCard index={SHOPIFY_TEMPLATES.length} />
        </div>

        {/* Saved themes */}
        <section className="mt-16">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-[590] tracking-[-0.6px] text-foreground">Your stores</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">Everything you&rsquo;ve generated with Zenya.</p>
            </div>
            <Link
              href={`/shopify/new${queryString}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-white shadow-soft-md transition hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              New store
            </Link>
          </div>

          {themes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-token bg-white/50 p-12 text-center backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1]">
                <Sparkles className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-[17px] font-[590] tracking-[-0.4px] text-foreground">No stores yet</h3>
              <p className="mx-auto mt-1.5 max-w-md text-[14px] text-muted">
                Pick the Storefront template above to build and install your first one-product store.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col rounded-2xl border border-token bg-white p-5 shadow-soft-md transition hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366f1]/10 text-[#6366f1]">
                      <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="rounded-full border border-token bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-[590] tracking-[-0.4px] text-foreground">{t.product_name}</h3>
                  <div className="mt-auto flex gap-2 pt-5">
                    <Link
                      href={`/preview/${t.id}${queryString}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-token bg-white/70 px-4 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-white"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                      Preview
                    </Link>
                    <button
                      onClick={() => handleDownload(t)}
                      disabled={downloadingId === t.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12.5px] font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2} />
                      {downloadingId === t.id ? '…' : 'Download'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  index,
  queryString,
}: {
  template: ShopifyTemplate;
  index: number;
  queryString: string;
}) {
  const tint = auroraTints[template.id];
  const Icon = template.icon;
  const buildHref = `/shopify/new${queryString}${queryString ? '&' : '?'}type=${template.type}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white shadow-soft-md transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      {/* Hover aurora wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint.orb1}, transparent 70%)` }}
      />

      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={themePreview(template.id)}
          alt={template.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          onError={(e) => {
            const fb = themePreviewFallback(template.id);
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' }}
        />
        <div className="absolute left-0 top-0 h-1 w-full" style={{ background: tint.accent }} />
        <div className="absolute right-4 top-4">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: tint.accent, color: '#fff' }}
          >
            Installs in store
          </span>
        </div>
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/80">{template.tagline}</p>
          <h3 className="mt-0.5 text-[24px] font-[590] tracking-[-0.6px]">{template.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-5">
        <p className="text-[13.5px] leading-[1.6] text-muted">{template.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: `${tint.accent}1a`, color: tint.accent }}
          >
            <Icon className="h-2.5 w-2.5" strokeWidth={2.25} />
            {template.tagline.split(' · ')[0]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Layers className="h-2.5 w-2.5" strokeWidth={2} />
            {template.sections} sections
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Palette className="h-2.5 w-2.5" strokeWidth={2} />
            {template.presets} presets
          </span>
        </div>

        <div className="mt-auto pt-5">
          <Link
            href={buildHref}
            className="group/btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:scale-[1.02]"
            style={{ background: tint.accent }}
          >
            Build &amp; install
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ComingSoonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-token bg-white/40 p-8 text-center backdrop-blur-md"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/5 text-muted">
        <Sparkles className="h-5 w-5" strokeWidth={2} />
      </div>
      <h3 className="text-[15px] font-[590] tracking-[-0.3px] text-foreground">More Shopify templates</h3>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted">
        Catalog &amp; collection themes that install into your store — launching monthly.
      </p>
    </motion.div>
  );
}

export default function ShopifyDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
