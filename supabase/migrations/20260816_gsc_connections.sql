-- Google Search Console per-user OAuth connections.
--
-- This table already existed in the live project but had no migration in the
-- repo, so a fresh environment (or a rebuild) would be missing it and the whole
-- GSC feature would fail at runtime ("relation gsc_connections does not exist").
-- This backfills the definition idempotently.
--
-- Access model: RLS is ON with NO policies on purpose — refresh/access tokens
-- must never be reachable by anon or authenticated clients. Every read/write
-- goes through the service-role client in app/api/gsc/*, which bypasses RLS.

create table if not exists public.gsc_connections (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  google_email  text,
  refresh_token text not null,
  access_token  text,
  token_expiry  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.gsc_connections enable row level security;

-- Lock the token store away from client roles; only the service role touches it.
revoke all on public.gsc_connections from anon, authenticated;
