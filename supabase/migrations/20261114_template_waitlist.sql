-- «نبّهني» on a template that is «قريبًا» (Anas, 2026-11-14): who wants to
-- hear when it opens. Written by /api/template-waitlist (service role,
-- rate-limited). RLS on with no policies: nothing is readable with the anon key.
create table if not exists public.template_waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  template text not null,                     -- atlas | studio | lookbook | collective | one_product
  email text not null,
  user_id uuid,                               -- set when the visitor was signed in
  page text,                                  -- where they pressed it
  notified_at timestamptz,                    -- set once we told them it opened
  unique (template, email)
);
create index if not exists template_waitlist_template_idx on public.template_waitlist (template, created_at desc);
alter table public.template_waitlist enable row level security;
