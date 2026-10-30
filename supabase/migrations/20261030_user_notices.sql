-- User notices: a short message from Beynoun with a link, shown in one owner's
-- notification bell until they open it. Used to invite a customer to try
-- something (first use: Hybrid Auto's preview of the new dashboard and editor).
--
--   href     where the notice opens, in a new tab
--   seen_at  set when the owner opens it; the bell shows only unseen rows
--
-- Rows are written only by the service role. No email is sent.

create table if not exists public.user_notices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  href        text,
  created_at  timestamptz not null default now(),
  seen_at     timestamptz
);

create index if not exists user_notices_user_idx on public.user_notices (user_id, created_at desc);

alter table public.user_notices enable row level security;
