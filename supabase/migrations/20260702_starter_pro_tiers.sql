-- =========================================================================
-- Zenya — Starter/Pro subscription tiers
-- =========================================================================
--
-- Replaces the one-time $9.99 / $19.99-hosting pricing shown to NEW signups
-- with two recurring tiers: Starter ($14.99/mo) and Pro ($24.99/mo, adds
-- Zenya hosting). Existing paying customers are grandfathered — their
-- 'pro_onetime' / 'pro_hosting' rows are untouched and keep working exactly
-- as before; enforce_theme_quota already treats anything non-'free' as
-- unlimited, so no trigger change is needed.
-- =========================================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free','pro_onetime','pro_hosting','starter','pro','admin'));
