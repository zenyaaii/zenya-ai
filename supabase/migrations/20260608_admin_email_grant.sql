-- =========================================================================
-- Zenya — pin admin entitlement to specific account emails.
--
-- The original rebuild migration hardcoded admin to a single UUID, which
-- means a re-signup or a different account never got the grant. This
-- migration grants admin by EMAIL, which survives signup/migration churn.
--
-- Also force-syncs has_hosting=true so the publish gate always lets the
-- admin through, even if a Stripe webhook earlier flipped the cached flag.
--
-- Idempotent: safe to re-run, and ON CONFLICT-style via UPDATE…WHERE.
-- =========================================================================

UPDATE public.profiles AS p
   SET plan             = 'admin',
       is_pro           = true,
       has_hosting      = true,
       pro_purchased_at = COALESCE(p.pro_purchased_at, now())
  FROM auth.users AS u
 WHERE u.id = p.id
   AND lower(u.email) = ANY (ARRAY[
     'anasalmusannef@outlook.com'
   ]);
