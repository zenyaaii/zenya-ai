-- =========================================================================
-- Zenya — Entry tier ($0.50 one-time generation unlock) + tier reshuffle
-- =========================================================================
--
-- Product change (2026-08-18):
--   • The old free tier is replaced by a $0.50 one-time "Entry" unlock. New
--     accounts can preview templates for free, but GENERATING a template now
--     requires the Entry unlock (or any paid plan). Entry still caps at the
--     2-template trial limit; template updates do NOT refill it.
--   • Existing free users are GRANDFATHERED: this migration flips
--     entry_unlocked = true for every current profile, so they keep generating
--     without paying. Only brand-new signups (entry_unlocked defaults false)
--     hit the paywall.
--   • Bookings + site analytics get a one-month trial for everyone and then
--     require Starter+ (previously Pro-only). See lib/booking-entitlement.ts
--     and lib/analytics-entitlement.ts for the app-side gate; this migration
--     only adds analytics_trial_started_at to mirror bookings_trial_started_at.
--
-- SAFETY: run in a transaction. The grandfather UPDATE touches only rows that
-- exist at apply time; the column default (false) governs future signups.
-- =========================================================================

BEGIN;

-- 1. New columns -----------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS entry_unlocked           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_unlocked_at        timestamptz,
  ADD COLUMN IF NOT EXISTS analytics_trial_started_at timestamptz;

-- 2. Allow the new 'entry' plan label --------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free','entry','pro_onetime','pro_hosting','starter','pro','admin'));

-- 3. Grandfather every EXISTING account — they keep generation access ------
--    without paying the new Entry fee. New signups default to false.
UPDATE public.profiles
   SET entry_unlocked = true
 WHERE entry_unlocked = false;

-- 4. Quota trigger: pay-to-generate + 2-template cap for the base tier -----
--    Base tier   = 'free' or 'entry':
--       - not entry_unlocked  → BLOCK (must buy the $0.50 Entry unlock)
--       - entry_unlocked      → allow up to trial_themes_limit (2), then block
--    Paid tiers  = starter / pro / pro_hosting / pro_onetime / admin → unlimited.
CREATE OR REPLACE FUNCTION public.enforce_theme_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan     text;
  v_used     int;
  v_limit    int;
  v_unlocked boolean;
BEGIN
  SELECT plan, trial_themes_used, trial_themes_limit, entry_unlocked
    INTO v_plan, v_used, v_limit, v_unlocked
    FROM public.profiles
   WHERE id = NEW.user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_missing: no profile row for user %', NEW.user_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Base tier (free / entry). Paid plans fall through with no cap.
  IF v_plan IN ('free', 'entry') THEN
    IF NOT COALESCE(v_unlocked, false) THEN
      RAISE EXCEPTION
        'entry_locked: generating requires the $0.50 Entry unlock (or a paid plan).'
        USING ERRCODE = 'P0001';
    END IF;

    IF v_used >= v_limit THEN
      RAISE EXCEPTION
        'trial_limit_reached: Entry allows up to % templates (you have used %). Upgrade to Starter for unlimited generations.',
        v_limit, v_used
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.profiles
       SET trial_themes_used = trial_themes_used + 1
     WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger definition is unchanged (BEFORE INSERT ON themes) — CREATE OR
-- REPLACE FUNCTION above swaps the body in place.

COMMIT;
