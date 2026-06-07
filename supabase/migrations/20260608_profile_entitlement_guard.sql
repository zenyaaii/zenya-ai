-- =========================================================================
-- Zenya — profile entitlement guard.
--
-- A BEFORE UPDATE trigger that prevents downgrading users whose
-- entitlement is owed by the underlying ground-truth tables:
--
--   - plan='admin' is permanent: any UPDATE keeps it admin.
--   - a non-refunded paid `purchases` row → is_pro stays true.
--   - an active|trialing|past_due `hosting_subscriptions` row → has_hosting
--     stays true.
--
-- This makes the cached profile flags self-healing: a buggy webhook,
-- a hand-typed UPDATE, or any future regression that tries to flip a
-- legitimate entitlement off will be silently corrected back to truth.
--
-- Refunds still work: status changes to 'refunded' → no longer matches
-- the EXISTS filter → user can be downgraded.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Admin is a permanent grant. No update path can flip it.
  IF OLD.plan = 'admin' THEN
    NEW.plan        := 'admin';
    NEW.is_pro      := true;
    NEW.has_hosting := true;
    RETURN NEW;
  END IF;

  -- Owns at least one non-refunded paid purchase → lifetime Pro is forever.
  IF NEW.is_pro = false AND EXISTS (
    SELECT 1 FROM public.purchases
     WHERE user_id = NEW.id
       AND status  = 'paid'
  ) THEN
    NEW.is_pro := true;
    IF NEW.plan = 'free' THEN
      NEW.plan := 'pro_onetime';
    END IF;
  END IF;

  -- Has an active recurring hosting subscription → has_hosting stays true.
  IF NEW.has_hosting = false AND EXISTS (
    SELECT 1 FROM public.hosting_subscriptions
     WHERE user_id = NEW.id
       AND status IN ('active', 'trialing', 'past_due')
  ) THEN
    NEW.has_hosting := true;
    IF NEW.plan = 'free' THEN
      NEW.plan := 'pro_hosting';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_entitlement ON public.profiles;
CREATE TRIGGER profiles_guard_entitlement
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_entitlement();
