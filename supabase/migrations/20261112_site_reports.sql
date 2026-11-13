-- Shake-to-report and the build questions' movement data, both shown in the
-- admin dashboard's «الزوار» tab. Written by /api/report and /api/wizard-events
-- (public, service role, rate-limited) and read only by /api/admin/visitors.
-- RLS on with no policies: nothing here is readable with the anon key.

-- One row per report a visitor sends (shake on a phone, the small button elsewhere).
create table if not exists public.site_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  text text,
  kind text not null default 'text',          -- screen | camera | text
  image_path text,                            -- in the private bucket site-reports
  page text,                                  -- path + query the visitor was on
  title text,                                 -- document.title at the time
  vw int, vh int,                             -- viewport, to tell phone from laptop
  user_agent text,
  user_id uuid,                               -- set when the visitor was signed in
  status text not null default 'new'          -- new | done
);
create index if not exists site_reports_created_idx on public.site_reports (created_at desc);
alter table public.site_reports enable row level security;

-- One row per move in a build wizard. A session is one visit to one wizard.
create table if not exists public.wizard_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  session text not null,                      -- random per visit, no person behind it
  wizard text not null,                       -- the path, e.g. /theme/new/restaurant
  label text,                                 -- what the page calls itself, e.g. «قالب الخدمات · صالون حلاقة»
  step_id text,
  step_title text,                            -- the step's heading, as the visitor saw it
  step_index int,
  step_count int,
  event text not null,                        -- view | leave | finish | wish
  how text,                                   -- leave: next | back | skip | jump | exit
  ms int,                                     -- leave: time spent on the step
  note text                                   -- wish: the visitor's answer to the last question
);
create index if not exists wizard_events_at_idx on public.wizard_events (at desc);
create index if not exists wizard_events_session_idx on public.wizard_events (session);
alter table public.wizard_events enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('site-reports', 'site-reports', false, 10485760)
on conflict (id) do nothing;
