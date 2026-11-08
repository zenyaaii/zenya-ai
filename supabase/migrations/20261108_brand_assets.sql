-- «الهوية»: every design the admins approved, with its files.
-- Read and written only by /api/admin/brand with the service role; RLS on, no policies.
-- Files live in the PRIVATE storage bucket brand-library and are handed out as short signed links.
create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'other',
  note text,
  approved_by text,
  approved_at timestamptz not null default now(),
  preview_path text,
  swatches text[],
  files jsonb not null default '[]'::jsonb, -- [{ name, path, size }]
  created_at timestamptz not null default now()
);
create index if not exists brand_assets_approved_idx on public.brand_assets (approved_at desc);
alter table public.brand_assets enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('brand-library', 'brand-library', false, 52428800)
on conflict (id) do nothing;
