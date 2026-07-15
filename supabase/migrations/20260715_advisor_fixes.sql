-- Advisor cleanup pass (2026-07-15).
--   1. Wrap auth.uid() in (select ...) on all row-level policies flagged by
--      auth_rls_initplan so the planner evaluates the call once per query
--      instead of once per row.
--   2. Pin generate_handle_base search_path (was mutable).
--   3. Revoke EXECUTE on assign_profile_handle from public/anon/authenticated
--      -- it's a trigger function, never meant to be called via /rest/rpc.
--   4. Split themes CRUD-ALL into per-command policies so SELECT has only one
--      permissive policy for `authenticated` (kills multiple_permissive_policies).
--   5. Add covering index on reviews.reviewed_by for the FK.

-- 1. Policies: profiles ------------------------------------------------------
alter policy "Users view own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users update own profile" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 1. Policies: purchases -----------------------------------------------------
alter policy "Users view own purchases" on public.purchases
  using ((select auth.uid()) = user_id);

-- 1. Policies: activity_logs -------------------------------------------------
alter policy "Users insert own logs" on public.activity_logs
  with check (((select auth.uid()) = user_id) or (user_id is null));

-- 1. Policies: scrape_history ------------------------------------------------
alter policy "Users view own scrape history" on public.scrape_history
  using ((select auth.uid()) = user_id);
alter policy "Users insert own scrape history" on public.scrape_history
  with check ((select auth.uid()) = user_id);

-- 1. Policies: hosting_subscriptions -----------------------------------------
alter policy "Users view own hosting sub" on public.hosting_subscriptions
  using ((select auth.uid()) = user_id);

-- 1. Policies: domains -------------------------------------------------------
alter policy "Users view own domains" on public.domains
  using ((select auth.uid()) = user_id);
alter policy "Users delete own domains" on public.domains
  using ((select auth.uid()) = user_id);

-- 1. Policies: gallery_images ------------------------------------------------
alter policy "Users read own gallery" on public.gallery_images
  using ((select auth.uid()) = user_id);
alter policy "Users insert own gallery" on public.gallery_images
  with check ((select auth.uid()) = user_id);
alter policy "Users delete own gallery" on public.gallery_images
  using ((select auth.uid()) = user_id);

-- 1. Policies: domain_purchases ----------------------------------------------
alter policy "Users read own domain purchases" on public.domain_purchases
  using ((select auth.uid()) = user_id);

-- 1. Policies: build_honesty_acks --------------------------------------------
alter policy "users insert own acks" on public.build_honesty_acks
  with check ((select auth.uid()) = user_id);
alter policy "users read own acks" on public.build_honesty_acks
  using ((select auth.uid()) = user_id);

-- 1. Policies: shopify_connections -------------------------------------------
alter policy "users insert own connections" on public.shopify_connections
  with check ((select auth.uid()) = user_id);
alter policy "users read own connections" on public.shopify_connections
  using ((select auth.uid()) = user_id);

-- 1. Policies: reviews -------------------------------------------------------
alter policy "Anyone submits a pending review" on public.reviews
  with check ((status = 'pending'::text) and ((user_id is null) or (user_id = (select auth.uid()))));

-- 1. Policies: user_promo_codes ----------------------------------------------
alter policy "own promo codes readable" on public.user_promo_codes
  using ((select auth.uid()) = user_id);

-- 2. Function: pin search_path -----------------------------------------------
alter function public.generate_handle_base(text) set search_path = pg_catalog, pg_temp;

-- 3. Revoke EXECUTE on the trigger-only SECURITY DEFINER function ------------
revoke execute on function public.assign_profile_handle() from public;
revoke execute on function public.assign_profile_handle() from anon;
revoke execute on function public.assign_profile_handle() from authenticated;

-- 4. Consolidate themes SELECT policies --------------------------------------
-- CRUD-ALL was firing for SELECT too, giving two permissive policies for
-- authenticated readers. Split into INSERT/UPDATE/DELETE + one SELECT
-- policy that also covers published-theme visibility for anon+authenticated.
drop policy if exists "Users CRUD own themes" on public.themes;
drop policy if exists "Anyone views published themes" on public.themes;

create policy "themes_select" on public.themes
  for select
  to anon, authenticated
  using (
    is_published = true
    or user_id = (select auth.uid())
  );

create policy "themes_insert_own" on public.themes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "themes_update_own" on public.themes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "themes_delete_own" on public.themes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Covering index for the FK the linter flagged ----------------------------
create index if not exists reviews_reviewed_by_idx on public.reviews (reviewed_by);
