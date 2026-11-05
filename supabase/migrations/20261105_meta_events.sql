-- Every event Meta sends to /api/meta/webhook (WhatsApp, Instagram, Page).
create table if not exists public.meta_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  platform text not null,          -- whatsapp_business_account | instagram | page
  field text,                      -- messages | comments | feed | ...
  account_id text,
  payload jsonb not null,
  handled_at timestamptz
);
create index if not exists meta_events_received_idx on public.meta_events (received_at desc);
alter table public.meta_events enable row level security;  -- service role only
