-- The build report on each lead (AI visitor score, its reasons, what was
-- missing) and the paid services that stopped (Anthropic, Apify, Google), both
-- read by the admin leads dashboard. Additive only.

alter table public.leads add column if not exists build jsonb;

create table if not exists public.service_alerts (
  service text primary key,           -- anthropic | apify | google
  status  text not null default 'ok', -- ok | down
  reason  text,                       -- «رصيد Anthropic انتهى»
  fix     text,                       -- what the admin does about it
  at      timestamptz not null default now()
);
-- Service role only: no policies, so no client reads or writes it.
alter table public.service_alerts enable row level security;
