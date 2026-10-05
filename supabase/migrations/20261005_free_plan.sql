-- =========================================================================
-- Zenya — the $0.50 Entry unlock becomes the Free plan
-- =========================================================================
--
-- Product change (2026-10-05):
--   • Generating no longer needs a payment. Every account gets what the
--     $0.50 Entry unlock used to give: two AI templates, publishing on
--     name.zenyaai.co, and the one-month bookings + analytics trial.
--   • The 2-template cap on the base tier ('free' / 'entry') stays exactly as
--     it was. Starter / Pro / legacy / admin stay uncapped.
--   • Nothing is refunded or taken away: anyone who paid the $0.50 keeps
--     plan = 'entry', which behaves the same as 'free'.
--
-- This reverses only the paywall half of 20260818_entry_tier.sql.
--
-- SAFETY: run in a transaction. Idempotent — safe to apply twice.
-- =========================================================================

BEGIN;

-- 1. New signups start unlocked ---------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN entry_unlocked SET DEFAULT true;

-- 2. Unlock every existing account that never paid --------------------------
UPDATE public.profiles
   SET entry_unlocked = true
 WHERE entry_unlocked = false;

-- 3. Quota trigger: no paywall, keep the 2-template cap ---------------------
CREATE OR REPLACE FUNCTION public.enforce_theme_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan  text;
  v_used  int;
  v_limit int;
BEGIN
  SELECT plan, trial_themes_used, trial_themes_limit
    INTO v_plan, v_used, v_limit
    FROM public.profiles
   WHERE id = NEW.user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_missing: no profile row for user %', NEW.user_id
      USING ERRCODE = 'P0001';
  END IF;

  -- Base tier (free / entry). Paid plans fall through with no cap.
  IF v_plan IN ('free', 'entry') THEN
    IF v_used >= v_limit THEN
      RAISE EXCEPTION
        'trial_limit_reached: the Free plan allows up to % templates (you have used %). Upgrade to Starter for unlimited generations.',
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

COMMIT;
