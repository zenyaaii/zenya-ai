-- Onboarding state persisted per-user (so it carries across devices/browsers).
--
-- WelcomeTour ("تعرّف على زينيا") and the dashboard PublishingPlan ("خطة
-- الإطلاق") both used to live only in localStorage — which meant opening the
-- dashboard from a second device replayed the tour and reset the checklist from
-- scratch. These two columns move that state onto the user's profile row.
--
--   welcome_tour_seen : has the owner dismissed/finished the welcome tour once?
--   launch_plan       : { create|edit|publish|seo|domain : bool } manual ticks.

alter table public.profiles
  add column if not exists welcome_tour_seen boolean not null default false,
  add column if not exists launch_plan jsonb not null default '{}'::jsonb;
