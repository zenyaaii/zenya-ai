-- =========================================================================
-- Zenya — free trial: 2 generations (was 3)
-- =========================================================================
--
-- New free signups get 2 trial generations instead of 3. Existing free
-- users are also moved to 2 so the product matches the pricing copy.
-- (Anyone who already used >= 2 was effectively at their cap anyway; the
-- enforce_theme_quota trigger blocks on used >= limit.)
-- Paid/admin plans are unaffected — the trigger only reads the limit for
-- plan = 'free'.
-- =========================================================================

ALTER TABLE public.profiles
  ALTER COLUMN trial_themes_limit SET DEFAULT 2;

UPDATE public.profiles
   SET trial_themes_limit = 2
 WHERE plan = 'free'
   AND trial_themes_limit <> 2;
