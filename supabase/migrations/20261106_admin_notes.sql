-- Shared notes for the admins (Anas + Yasin), in folders. Read and written
-- only by /api/admin/notes with the service role; RLS on, no policies.
create table if not exists public.admin_note_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.admin_note_folders(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  author text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists admin_notes_folder_idx on public.admin_notes (folder_id, updated_at desc);
alter table public.admin_note_folders enable row level security;
alter table public.admin_notes enable row level security;
