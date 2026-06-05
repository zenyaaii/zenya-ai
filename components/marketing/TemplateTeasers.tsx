/**
 * Curated, designed "taste" of each template — rendered inside the preview
 * box on the homepage. Goal: capture the template's vibe in one glance,
 * not show the full template. Static markup (no animations beyond CSS) so
 * it pops into view the instant the modal opens.
 *
 * If you want the full thing, the "Full preview" button below the box
 * opens the live /demo/{template} page in a new tab.
 */

type TeaserId =
  | 'one_product'
  | 'collective'
  | 'restaurant'
  | 'atlas'
  | 'lookbook'
  | 'studio'
  | 'wellness'
  | 'services'

/** Returns a JSX teaser keyed by template business_type. */
export function TemplateTeaser({ id }: { id: TeaserId }) {
  switch (id) {
    case 'one_product':   return <StorefrontTeaser />
    case 'collective':    return <CollectiveTeaser />
    case 'restaurant':    return <RestaurantTeaser />
    case 'atlas':         return <AtlasTeaser />
    case 'lookbook':      return <LookbookTeaser />
    case 'studio':        return <StudioTeaser />
    case 'wellness':      return <WellnessTeaser />
    case 'services':      return <TradeTeaser />
    default:              return null
  }
}

/* ────────────── Storefront — clean conversion product page ────────────── */

function StorefrontTeaser() {
  return (
    <div className="grid h-full w-full grid-cols-5 bg-white">
      <div className="col-span-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eef1ff 0%, #fff 100%)' }}>
        <div className="aspect-square w-2/3 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #5e6ad2 0%, #7170ff 100%)',
          boxShadow: '0 24px 60px -20px rgba(94,106,210,0.40)',
        }} />
      </div>
      <div className="col-span-2 flex flex-col justify-between p-6">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5e6ad2]">New · In stock</div>
          <h3 className="mt-2 text-[20px] font-semibold leading-[1.15] text-[#1c1c1c]">The Everyday Carry</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[18px] font-bold text-[#1c1c1c]">$49</span>
            <span className="text-[11px] text-[#9b9b9b] line-through">$79</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#1c1c1c]">
            ★★★★★ <span className="ml-1 text-[#6b6b6b]">2,412 reviews</span>
          </div>
        </div>
        <button className="rounded-full bg-[#1c1c1c] py-2.5 text-[12px] font-semibold text-white">
          Add to cart →
        </button>
      </div>
    </div>
  )
}

/* ────────────── Collective — multi-product catalog ────────────── */

function CollectiveTeaser() {
  const tiles = [
    { tint: '#fde68a', label: 'Linen Tee', price: '$38' },
    { tint: '#bbf7d0', label: 'Brass Lamp', price: '$129' },
    { tint: '#fbcfe8', label: 'Wool Throw', price: '$84' },
    { tint: '#bfdbfe', label: 'Ceramic Set', price: '$56' },
  ]
  return (
    <div className="h-full w-full p-4" style={{ background: '#fdfaf3' }}>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9b6f00]">Collective</div>
          <h3 className="text-[18px] font-semibold text-[#1c1c1c]">Things we love this week</h3>
        </div>
        <span className="text-[10px] text-[#6b6b6b]">Shop all →</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {tiles.map((t, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-white" style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.06)' }}>
            <div className="aspect-[4/5]" style={{ background: t.tint }} />
            <div className="p-2">
              <div className="text-[10px] font-medium text-[#1c1c1c]">{t.label}</div>
              <div className="text-[10px] font-semibold text-[#9b6f00]">{t.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ────────────── Restaurant — elegant menu / reservation ────────────── */

function RestaurantTeaser() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center text-white" style={{
      background: 'radial-gradient(60% 80% at 50% 40%, #1a1410 0%, #0a0a0c 100%)',
    }}>
      <div className="text-[9px] font-semibold uppercase tracking-[0.45em] text-[#c8a96a]">Maison & Co.</div>
      <h3 className="mt-4 text-[34px] leading-[1.05] tracking-[-0.5px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>
        À la table.
      </h3>
      <div className="mt-5 grid w-full max-w-[280px] gap-2.5 text-left">
        <Row label="Burrata · tomato confit" price="€16" />
        <Row label="Côte de bœuf, 600g" price="€48" />
        <Row label="Tarte aux pommes" price="€11" />
      </div>
      <button className="mt-6 rounded-full border border-[#c8a96a] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8a96a]">
        Reserve a table
      </button>
    </div>
  )
}

function Row({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/10 pb-2 text-[11px]">
      <span className="opacity-90">{label}</span>
      <span className="font-semibold text-[#c8a96a]">{price}</span>
    </div>
  )
}

/* ────────────── Atlas — SaaS landing ────────────── */

function AtlasTeaser() {
  return (
    <div className="relative h-full w-full overflow-hidden p-6 text-white" style={{
      background: 'radial-gradient(80% 60% at 50% 0%, #4338ca 0%, #1e1b4b 100%)',
    }}>
      <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#a5b4fc]">Atlas · Workspace</div>
      <h3 className="mt-3 text-[26px] font-[600] leading-[1.05] tracking-[-0.5px]">
        The OS your team will{' '}
        <span style={{ background: 'linear-gradient(120deg, #a5b4fc, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          actually use.
        </span>
      </h3>
      <div className="mt-4 flex gap-2">
        <button className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1e1b4b]">Start free →</button>
        <button className="rounded-md border border-white/30 px-3 py-1.5 text-[11px] font-medium">Book a demo</button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[{ k: '2.4×', v: 'faster shipping' }, { k: '99.99%', v: 'uptime SLA' }, { k: '12k', v: 'happy teams' }].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/15 bg-white/5 p-2 backdrop-blur">
            <div className="text-[16px] font-bold">{s.k}</div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-white/60">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ────────────── Lookbook — fashion editorial ────────────── */

function LookbookTeaser() {
  return (
    <div className="grid h-full w-full grid-cols-2 bg-[#fdfaf3]">
      <div className="flex flex-col justify-between p-6">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#1c1c1c]">FW · 2026</div>
          <h3 className="mt-4 text-[40px] leading-[0.95] tracking-[-1.2px] text-[#1c1c1c]" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Quiet
            <br />
            colors.
          </h3>
        </div>
        <button className="self-start text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1c1c1c] underline underline-offset-4">
          Shop the edit →
        </button>
      </div>
      <div className="grid grid-cols-1 grid-rows-2 gap-2 p-3">
        <div className="rounded-lg" style={{ background: 'linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)' }} />
        <div className="rounded-lg" style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 100%)' }} />
      </div>
    </div>
  )
}

/* ────────────── Studio — brand / founder story ────────────── */

function StudioTeaser() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-center" style={{ background: '#f7f4ed' }}>
      <div className="max-w-md">
        <div className="mx-auto mb-5 h-14 w-14 rounded-full" style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #4a4a4a 100%)' }} />
        <blockquote className="text-[18px] leading-[1.45] text-[#1c1c1c]" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          “We started Studio because the work we wanted to do didn’t exist anywhere we worked.”
        </blockquote>
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6b6b6b]">
          — Mira Lehto · Founder
        </div>
      </div>
    </div>
  )
}

/* ────────────── Wellness — spa / retreat ────────────── */

function WellnessTeaser() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 text-center" style={{
      background: 'radial-gradient(80% 70% at 30% 30%, #d1fae5 0%, #ecfdf5 50%, #f0fdfa 100%)',
    }}>
      <div className="absolute right-6 top-6 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#15803d]">Wellness · Studio</div>
      <h3 className="text-[34px] leading-[1.05] tracking-[-0.6px] text-[#0f3a26]" style={{ fontFamily: 'Georgia, serif' }}>
        Find your
        <br />
        <em>calm</em>.
      </h3>
      <p className="mt-3 max-w-xs text-[12px] leading-[1.55] text-[#365a47]">
        Sound baths, breathwork & guided rest. Mornings + evenings, every day.
      </p>
      <button className="mt-5 rounded-full bg-[#15803d] px-5 py-2.5 text-[11px] font-semibold text-white">
        Book a session →
      </button>
    </div>
  )
}

/* ────────────── Trade (Services) — local trades ────────────── */

function TradeTeaser() {
  return (
    <div className="grid h-full w-full grid-cols-5" style={{ background: '#0f172a' }}>
      <div className="col-span-3 flex flex-col justify-between p-6 text-white">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fb923c]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#fb923c]">
            Trusted · 200+ jobs
          </div>
          <h3 className="mt-3 text-[26px] leading-[1.05] tracking-[-0.5px]">
            Roofing that
            <br />
            lasts <span className="text-[#fb923c]">decades</span>.
          </h3>
        </div>
        <button className="self-start rounded-md bg-[#fb923c] px-4 py-2 text-[12px] font-semibold text-[#0f172a]">
          Get a free quote
        </button>
      </div>
      <div className="col-span-2 grid grid-rows-3 gap-1 p-3">
        <Pill label="Free estimate" />
        <Pill label="Licensed + insured" />
        <Pill label="Same-week start" />
      </div>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-2 text-[10px] font-medium text-white/85">
      ✓ {label}
    </div>
  )
}
