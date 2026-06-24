'use client';

import { TitleBar } from '@shopify/app-bridge-react';
import Link from 'next/link';
import ZenyaMark from '@/components/ZenyaMark';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  LayoutGrid,
  Store,
  Settings,
  ShoppingBag,
  Shirt,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ExternalLink,
  Layers,
  Palette,
  Eye,
  Download,
  Plus,
  LogOut,
  Check,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateShopifyTheme } from '@/utils/shopify-generator';
import { saveAs } from 'file-saver';
import AuroraBackground from '@/components/marketing/AuroraBackground';
import { auroraTints } from '@/lib/aurora-tints';
import { themePreview, themePreviewFallback } from '@/lib/theme-previews';
import { cn } from '@/lib/utils';

type View = 'overview' | 'templates' | 'stores' | 'account';

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'templates', label: 'القوالب', icon: LayoutGrid },
  { id: 'stores', label: 'متاجري', icon: Store },
  { id: 'account', label: 'الحساب', icon: Settings },
];

/* ── Ecommerce templates. `status: live` installs into the store today;
 *    `soon` are ecommerce designs being ported from hosted sites to real
 *    Shopify liquid themes. Flip a card to live by setting type + status. ── */
type TemplateStatus = 'live' | 'soon';
type Template = {
  id: keyof typeof auroraTints;
  name: string;
  tagline: string;
  description: string;
  sections: number;
  presets: number;
  icon: LucideIcon;
  type: string | null;
  status: TemplateStatus;
};

const TEMPLATES: Template[] = [
  {
    id: 'one_product',
    name: 'واجهة المتجر',
    tagline: 'منتج واحد · دروبشيبينغ',
    description:
      'قالب منتج واحد يركّز على التحويل. قمع رئيسي، وزر إضافة للسلة ثابت، وحزم، ومقارنة، وأسئلة شائعة، وعناصر إلحاح، ومراجعات حقيقية مستوردة، وصفحة منتج كاملة — يُثبَّت مباشرةً في هذا المتجر.',
    sections: 24,
    presets: 3,
    icon: ShoppingBag,
    type: 'one_product',
    status: 'live',
  },
  {
    id: 'collective',
    name: 'الكتالوج',
    tagline: 'كتالوج · متعدّد المنتجات',
    description:
      'واجهة متجر متعدّد المنتجات للمتاجر ذات الكتالوج الكامل — شبكة تشكيلات منسّقة، ووافدات جديدة، والأكثر مبيعًا، ووعد العلامة التجارية، ونشرة بريدية. يُثبَّت في متجرك ويعرض منتجاتك الحقيقية.',
    sections: 10,
    presets: 4,
    icon: Store,
    type: null,
    status: 'soon',
  },
  {
    id: 'lookbook',
    name: 'دفتر الإطلالات',
    tagline: 'دفتر إطلالات · أزياء',
    description:
      'واجهة أزياء تحريرية — قسم رئيسي بعرض كامل، وشبكة إطلالات قابلة للتسوّق، وتشكيلة منتجات، وقصة العلامة التجارية. تصميم تجارة إلكترونية ننقله إلى قالب Shopify حقيقي؛ وستحرّره داخل Shopify مباشرةً.',
    sections: 12,
    presets: 5,
    icon: Shirt,
    type: null,
    status: 'soon',
  },
];

/** Where "generate more templates" sends merchants — the full web catalog. */
const WEBSITE_TEMPLATES_URL = 'https://zenyaai.co/themes';

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
  const [view, setView] = useState<View>('overview');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const storeName = shop ? shop.replace('.myshopify.com', '') : 'متجرك';

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchThemes();
      else setLoading(false);
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
        alert('تم إنشاء الحساب! يُرجى التحقّق من بريدك الإلكتروني للتأكيد.');
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setThemes([]);
    setView('overview');
  }

  async function handleDownload(theme: any) {
    setDownloadingId(theme.id);
    try {
      const blob = await generateShopifyTheme(theme.product_name, theme.content, theme.colors, theme.images || []);
      const fileName = `${String(theme.product_name || 'zenya-theme').toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`;
      saveAs(blob, fileName);
    } catch (e) {
      console.error(e);
      alert('فشل التنزيل.');
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
          <span className="text-sm font-medium">جارٍ تحميل الاستوديو…</span>
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
              مرحبًا بك في <span className="gradient-text">زينيا AI</span>
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              {isSignUp ? 'أنشئ حسابًا لحفظ متاجرك.' : 'سجّل الدخول لبناء القوالب وتثبيتها في متجرك.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground">البريد الإلكتروني</label>
              <input
                type="email"
                required
                dir="ltr"
                className="w-full rounded-xl border border-token bg-white px-4 py-2.5 text-start text-foreground outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/15"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-foreground">كلمة المرور</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-token bg-white px-4 py-2.5 text-foreground outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{authError}</div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-full bg-foreground py-3 text-[14px] font-semibold text-white shadow-soft-md transition hover:scale-[1.01] disabled:opacity-50"
            >
              {authLoading ? 'يُرجى الانتظار…' : isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-muted">
            {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-[#6366f1] hover:underline">
              {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const liveCount = TEMPLATES.filter((t) => t.status === 'live').length;
  const soonCount = TEMPLATES.filter((t) => t.status === 'soon').length;

  /* ── Authenticated app shell ── */
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AuroraBackground fixed intensity={0.55} />
      <TitleBar title="Zenya AI" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 md:py-8">
        {/* Sidebar */}
        <aside className="md:w-60 md:shrink-0">
          <div className="md:sticky md:top-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
              <ZenyaMark className="h-5 text-[#16171b]" />
              <span className="rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6366f1]">AI</span>
            </div>

            <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-token bg-white/70 p-1.5 backdrop-blur-md shadow-soft-md md:flex-col">
              {NAV.map((n) => {
                const active = view === n.id;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => setView(n.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition md:w-full',
                      active ? 'bg-foreground text-white shadow-sm' : 'text-muted hover:bg-foreground/5 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {n.label}
                  </button>
                );
              })}
            </nav>

            {/* Account card */}
            <div className="hidden rounded-2xl border border-token bg-white/70 p-3.5 backdrop-blur-md shadow-soft-md md:block">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#a78bfa] text-[13px] font-bold text-white">
                  {(user.email || 'Z').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-foreground">{storeName}</p>
                  <p className="truncate text-[11px] text-muted">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {view === 'overview' && (
            <OverviewView
              storeName={storeName}
              themesCount={themes.length}
              liveCount={liveCount}
              soonCount={soonCount}
              queryString={queryString}
              onBrowse={() => setView('templates')}
            />
          )}
          {view === 'templates' && <TemplatesView queryString={queryString} />}
          {view === 'stores' && (
            <StoresView
              themes={themes}
              queryString={queryString}
              downloadingId={downloadingId}
              onDownload={handleDownload}
              onBrowse={() => setView('templates')}
            />
          )}
          {view === 'account' && <AccountView email={user.email} storeName={storeName} shop={shop} onSignOut={handleSignOut} />}
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────── Views ────────────────────────── */

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-[590] tracking-[-0.8px] text-foreground sm:text-[30px]">{title}</h1>
        <p className="mt-1 text-[14px] text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewView({
  storeName, themesCount, liveCount, soonCount, queryString, onBrowse,
}: {
  storeName: string; themesCount: number; liveCount: number; soonCount: number; queryString: string; onBrowse: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <SectionHeader title={`مرحبًا بعودتك، ${storeName}`} subtitle="ابنِ متجرًا جاهزًا للتحويل وثبّته ببضع نقرات." />

      {/* Hero CTA */}
      <div className="relative overflow-hidden rounded-3xl border border-token bg-white/80 p-7 shadow-soft-md backdrop-blur-md sm:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 100% at 100% 0%, rgba(99,102,241,0.14), transparent 60%)' }} />
        <div className="relative max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-token bg-white/70 px-3 py-1 text-[11.5px] font-medium text-muted">
            <Sparkles className="h-3 w-3 text-[#6366f1]" strokeWidth={2.25} /> مُنشئ المتاجر بالذكاء الاصطناعي
          </div>
          <h2 className="text-[28px] font-[590] leading-[1.1] tracking-[-1px] text-foreground sm:text-[34px]">
            حوّل رابط منتج إلى <span className="gradient-text">متجر Shopify مباشر.</span>
          </h2>
          <p className="mt-3 text-[14.5px] leading-[1.6] text-muted">
            الصق رابط منتج — تكتب زينيا النصوص، وتستورد مراجعات حقيقية، وتصمّم الصفحة، وتثبّت القالب والمنتج مباشرةً في متجرك.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/shopify/new${queryString}${queryString ? '&' : '?'}type=one_product`} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[14px] font-semibold text-white shadow-soft-md transition hover:scale-[1.02]">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> بناء متجر جديد
            </Link>
            <button onClick={onBrowse} className="inline-flex items-center gap-2 rounded-full border border-token bg-white/70 px-6 py-3 text-[14px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white">
              تصفّح القوالب <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label="متاجر مبنيّة" value={String(themesCount)} />
        <StatCard icon={Check} label="قوالب جاهزة" value={String(liveCount)} accent />
        <StatCard icon={Clock} label="قادم إلى Shopify" value={String(soonCount)} />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-token bg-white/70 p-5 backdrop-blur-md shadow-soft-md">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-xl', accent ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-foreground/5 text-muted')}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <p className="text-[28px] font-[590] leading-none tracking-[-1px] text-foreground">{value}</p>
      <p className="mt-1.5 text-[12.5px] font-medium text-muted">{label}</p>
    </div>
  );
}

function TemplatesView({ queryString }: { queryString: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <SectionHeader title="القوالب" subtitle="قوالب تجارة إلكترونية تُثبَّت مباشرةً في متجر Shopify الخاص بك." />
      <div className="grid gap-6 sm:grid-cols-2">
        {TEMPLATES.map((t, i) => (
          <TemplateCard key={t.id} template={t} index={i} queryString={queryString} />
        ))}
      </div>

      {/* Everything else lives on the website */}
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-token bg-white/70 p-6 shadow-soft-md backdrop-blur-md">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(99,102,241,0.10), transparent 60%)' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6366f1]/10 text-[#6366f1]">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-[590] tracking-[-0.3px] text-foreground">تحتاج نوعًا مختلفًا من المواقع؟</h3>
              <p className="mt-0.5 max-w-md text-[13px] leading-[1.55] text-muted">
                مطاعم، وبرمجيات كخدمة، وأزياء، وخدمات وغيرها — ابنِها على موقع زينيا. لا تُثبَّت هنا إلا قوالب متاجر التجارة الإلكترونية.
              </p>
            </div>
          </div>
          <a
            href={WEBSITE_TEMPLATES_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-token bg-white px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition hover:bg-foreground hover:text-white"
          >
            أنشئ المزيد على موقعنا
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function TemplateCard({ template, index, queryString }: { template: Template; index: number; queryString: string }) {
  const tint = auroraTints[template.id];
  const Icon = template.icon;
  const isLive = template.status === 'live';
  const buildHref = `/shopify/new${queryString}${queryString ? '&' : '?'}type=${template.type}`;
  const demoHref = `https://zenyaai.co/demo/${template.id === 'one_product' ? '' : template.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white shadow-soft-md transition-all duration-200',
        isLive ? 'hover:-translate-y-1 hover:shadow-soft-lg' : 'opacity-95'
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint.orb1}, transparent 70%)` }} />

      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={themePreview(template.id)}
          alt={template.name}
          className={cn('absolute inset-0 h-full w-full object-cover transition duration-700', isLive ? 'group-hover:scale-[1.04]' : 'saturate-[0.85]')}
          onError={(e) => { const fb = themePreviewFallback(template.id); if (e.currentTarget.src !== fb) e.currentTarget.src = fb; }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
        <div className="absolute left-0 top-0 h-1 w-full" style={{ background: tint.accent }} />
        <div className="absolute right-4 top-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: tint.accent }}>
              <Check className="h-2.5 w-2.5" strokeWidth={3} /> يُثبَّت في المتجر
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <Clock className="h-2.5 w-2.5" strokeWidth={3} /> قريبًا
            </span>
          )}
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
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: `${tint.accent}1a`, color: tint.accent }}>
            <Icon className="h-2.5 w-2.5" strokeWidth={2.25} /> {template.tagline.split(' · ')[0]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Layers className="h-2.5 w-2.5" strokeWidth={2} /> {template.sections} قسمًا
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Palette className="h-2.5 w-2.5" strokeWidth={2} /> {template.presets} أنماط
          </span>
        </div>

        <div className="mt-auto pt-5">
          {isLive ? (
            <Link href={buildHref} className="group/btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:scale-[1.02]" style={{ background: tint.accent }}>
              بناء وتثبيت
              <ArrowUpRight className="h-3.5 w-3.5 rtl-flip transition-transform group-hover/btn:-translate-x-0.5 group-hover/btn:-translate-y-0.5" strokeWidth={2.5} />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button disabled className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-token bg-foreground/5 px-4 py-2.5 text-[13px] font-semibold text-muted">
                <Clock className="h-3.5 w-3.5" strokeWidth={2} /> نسخة Shopify قيد الإعداد
              </button>
              <a href={demoHref} target="_blank" rel="noreferrer" className="rounded-full border border-token bg-white/70 px-4 py-2.5 text-[13px] font-semibold text-foreground transition hover:bg-white" aria-label={`معاينة عرض ${template.name}`}>
                عرض توضيحي
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StoresView({
  themes, queryString, downloadingId, onDownload, onBrowse,
}: {
  themes: any[]; queryString: string; downloadingId: string | null; onDownload: (t: any) => void; onBrowse: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <SectionHeader
        title="متاجري"
        subtitle="كل ما أنشأته باستخدام زينيا."
        action={
          <Link href={`/shopify/new${queryString}`} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-white shadow-soft-md transition hover:scale-[1.02]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> متجر جديد
          </Link>
        }
      />

      {themes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-token bg-white/50 p-12 text-center backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1]">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </div>
          <h3 className="text-[17px] font-[590] tracking-[-0.4px] text-foreground">لا توجد متاجر بعد</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[14px] text-muted">ابنِ أول متجر منتج واحد لك من قالب واجهة المتجر.</p>
          <button onClick={onBrowse} className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:scale-[1.02]">
            تصفّح القوالب <ArrowRight className="h-4 w-4 rtl-flip" strokeWidth={2.25} />
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                <span className="rounded-full border border-token bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-muted">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-[17px] font-[590] tracking-[-0.4px] text-foreground">{t.product_name}</h3>
              <div className="mt-auto flex gap-2 pt-5">
                <Link href={`/preview/${t.id}${queryString}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-token bg-white/70 px-4 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-white">
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} /> معاينة
                </Link>
                <button onClick={() => onDownload(t)} disabled={downloadingId === t.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12.5px] font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50">
                  <Download className="h-3.5 w-3.5" strokeWidth={2} /> {downloadingId === t.id ? '…' : 'تنزيل'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AccountView({ email, storeName, shop, onSignOut }: { email: string; storeName: string; shop: string | null; onSignOut: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <SectionHeader title="الحساب" subtitle="حساب زينيا الخاص بك والمتجر المرتبط." />
      <div className="space-y-4">
        <div className="rounded-2xl border border-token bg-white/80 p-6 shadow-soft-md backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#a78bfa] text-[20px] font-bold text-white">
              {(email || 'Z').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-[590] tracking-[-0.3px] text-foreground">{email}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> حساب زينيا
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="المتجر المرتبط" value={shop || '—'} />
          <InfoRow label="اسم المتجر" value={storeName} />
        </div>

        <div className="rounded-2xl border border-token bg-white/70 p-5 shadow-soft-md backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-foreground">تسجيل الخروج</p>
              <p className="mt-0.5 text-[12.5px] text-muted">إنهاء جلستك في هذا المتصفّح.</p>
            </div>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-full border border-token bg-white px-5 py-2.5 text-[13px] font-semibold text-foreground transition hover:bg-foreground hover:text-white">
              <LogOut className="h-3.5 w-3.5 rtl-flip" strokeWidth={2} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-token bg-white/70 p-5 shadow-soft-md backdrop-blur-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1.5 truncate text-[15px] font-[590] tracking-[-0.2px] text-foreground">{value}</p>
    </div>
  );
}

export default function ShopifyDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">جارٍ التحميل…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
