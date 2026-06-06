'use client'

import { Users, BarChart3, Globe, Smartphone } from 'lucide-react'

export default function VisitorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Visitors</h1>
        <p className="mt-1 text-[13px] text-muted">
          Who is showing up to your Zenya-hosted sites, where they came from, and what they did.
        </p>
      </header>

      {/* Coming soon banner */}
      <div className="relative overflow-hidden rounded-2xl border border-token bg-white p-6"
           style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(94,106,210,0.06), transparent 70%)' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
               style={{ background: 'white', boxShadow: '0 4px 16px -8px rgba(94,106,210,0.40), 0 0 0 1px rgba(94,106,210,0.20) inset' }}>
            <Users className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(94,106,210,0.10)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Coming soon
            </div>
            <h2 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
              Privacy-friendly visitor analytics
            </h2>
            <p className="mt-1 text-[13px] leading-[1.55] text-muted">
              We already track aggregate pageviews in your <strong>Analytics</strong> page. This view will
              add per-visitor detail — referrer, country, device, what page they landed on, how long they
              stayed — without cookies, fingerprinting, or third-party trackers.
            </p>
          </div>
        </div>
      </div>

      {/* Mockup preview */}
      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Preview</h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-token bg-white" style={{ opacity: 0.85 }}>
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-px bg-[#f0ede6] sm:grid-cols-4">
          <FakeStat label="Visitors (7d)"     value="—"  sub="awaiting data" />
          <FakeStat label="Top country"       value="—"  sub="awaiting data" />
          <FakeStat label="Top referrer"      value="—"  sub="awaiting data" />
          <FakeStat label="Avg session"       value="—"  sub="awaiting data" />
        </div>

        {/* Table mockup */}
        <div className="border-t border-token p-5">
          <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Recent sessions</div>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-md bg-surface/50 px-3 py-2">
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-muted/40" />
                <div className="h-3 w-1/4 rounded bg-[rgba(28,28,28,0.06)]" />
                <div className="h-3 w-1/5 rounded bg-[rgba(28,28,28,0.04)]" />
                <div className="ml-auto h-3 w-12 rounded bg-[rgba(28,28,28,0.04)]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promise list */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Promise icon={Globe} title="Per-site breakdown" body="Filter by which Zenya site they visited — your bistro vs. your wellness studio." />
        <Promise icon={BarChart3} title="No cookie banners needed" body="GDPR-friendly. No personal identifiers, no cookies, no third-party trackers." />
        <Promise icon={Smartphone} title="Where & how" body="Country, device, referrer. Enough to act on, not enough to need a privacy policy update." />
      </div>
    </div>
  )
}

function FakeStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 text-[24px] font-bold text-foreground">{value}</div>
      <div className="mt-1 text-[12px] text-muted">{sub}</div>
    </div>
  )
}

function Promise({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />
      <div className="mt-2 text-[13.5px] font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">{body}</p>
    </div>
  )
}
