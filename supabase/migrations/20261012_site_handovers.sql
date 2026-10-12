-- Site handovers: Zenya builds a site for a lead, moves it into the lead's own
-- account, then asks "did you get everything?". One row per notice sent.
--
--   status   pending until the owner answers, then yes / no (no carries a note)
--   is_test  the admin sent it to themselves to see it first
--   token    the only key the /handover/<token> page has (where "no" asks
--            what went wrong), so it is long and random
--   email    the account's address at the time, shown to the admin
--
-- Rows are written only by the service role (the admin route and the answer
-- route). An owner may read their own rows, which is how the notification bell
-- finds an unanswered one. No email is sent.

create table if not exists public.site_handovers (
  id           uuid primary key default gen_random_uuid(),
  theme_id     uuid not null references public.themes(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  token        text not null unique,
  is_test      boolean not null default false,
  status       text not null default 'pending' check (status in ('pending', 'yes', 'no')),
  note         text,
  sent_by      uuid references auth.users(id) on delete set null,
  sent_at      timestamptz not null default now(),
  answered_at  timestamptz
);

create index if not exists site_handovers_user_idx on public.site_handovers (user_id, sent_at desc);
create index if not exists site_handovers_theme_idx on public.site_handovers (theme_id, sent_at desc);

alter table public.site_handovers enable row level security;

drop policy if exists site_handovers_owner_read on public.site_handovers;
create policy site_handovers_owner_read on public.site_handovers
  for select to authenticated
  using (user_id = (select auth.uid()));
