-- Free-domain entitlement (one free 1-year domain per Pro account, cheap TLDs
-- only) + a persistent store of the discount codes a user has earned so they
-- can re-access them from Settings.
--
-- Applied to the live project via MCP on 2026-07-06; this file keeps the repo
-- schema history in sync.

-- One free 1-year domain per Pro account (standard/cheap TLDs only).
alter table public.profiles
  add column if not exists free_domain_claimed_at timestamptz,
  add column if not exists free_domain text;

comment on column public.profiles.free_domain_claimed_at is
  'When the account redeemed its one free Pro domain. Null = still available.';
comment on column public.profiles.free_domain is
  'The domain redeemed with the free-domain entitlement.';

-- Persistent discount codes, so a one-time reveal (e.g. the review-offer
-- overlay) is never lost.
create table if not exists public.user_promo_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null,
  label       text,
  description text,
  kind        text,               -- 'subscription' | 'domain' | 'other'
  source      text,               -- 'review' | 'pro_perk' | 'manual'
  created_at  timestamptz not null default now(),
  unique (user_id, code)
);

alter table public.user_promo_codes enable row level security;

-- Owner can read their own codes. Writes go through the service-role API
-- route only (no client insert/update/delete policies on purpose).
drop policy if exists "own promo codes readable" on public.user_promo_codes;
create policy "own promo codes readable"
  on public.user_promo_codes for select
  using (auth.uid() = user_id);

create index if not exists user_promo_codes_user_idx
  on public.user_promo_codes (user_id, created_at desc);
