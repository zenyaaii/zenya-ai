-- Leads (moved in from the Lead Studio artifact) and every WhatsApp message
-- in or out of the Beynoun number. Service role only: read through
-- /api/admin/* which checks profiles.plan = 'admin'.
create table if not exists public.leads (
  id text primary key,
  name text not null,
  kind text,
  country text,
  city text,
  area text,
  address text,
  rating numeric,
  reviews int,
  phone text,
  wa text,                 -- WhatsApp number, digits only, with country code
  maps text,
  template text,
  social text,             -- Facebook/Instagram link when they have one
  site text,               -- the site we built for them
  status text not null default 'new',  -- new | sent | replied | client | later | noans | no
  sent_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_wa_idx on public.leads (wa);
alter table public.leads enable row level security;

create table if not exists public.wa_messages (
  id bigint generated always as identity primary key,
  wamid text unique,       -- WhatsApp message id
  lead_id text references public.leads(id) on delete set null,
  wa text not null,        -- the other side's number, digits only
  direction text not null, -- in | out
  kind text not null default 'text',   -- text | template | image | ...
  body text,
  status text,             -- out: sent | delivered | read | failed ; in: received
  error text,
  at timestamptz not null default now(),
  raw jsonb
);
create index if not exists wa_messages_wa_idx on public.wa_messages (wa, at desc);
create index if not exists wa_messages_lead_idx on public.wa_messages (lead_id, at desc);
alter table public.wa_messages enable row level security;
