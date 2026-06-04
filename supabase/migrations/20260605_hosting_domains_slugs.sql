-- =========================================================================
-- Zenya — Phase 1: hosting subscriptions, custom domains, slugs, analytics
-- =========================================================================
--
-- Adds infrastructure for:
--   - $19.99/mo recurring hosting plan (plan='pro_hosting')
--   - Custom domains pointing at Zenya-hosted brochure sites
--   - Public slug for each published theme
--   - Analytics cache (view_count + last_viewed_at) on themes
--   - Stripe subscription mirror for the hosting plan
--
-- All new tables get RLS + the same updated_at trigger pattern.
-- =========================================================================

-- ---- profiles: hosting plan cache ----------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free','pro_onetime','pro_hosting','admin'));

-- Rename pro_lifetime → pro_onetime (semantic clarity now that there's also a
-- hosting subscription tier).
UPDATE public.profiles SET plan = 'pro_onetime' WHERE plan = 'pro_lifetime';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_hosting            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hosting_subscription_id text,
  ADD COLUMN IF NOT EXISTS hosting_status         text,
  ADD COLUMN IF NOT EXISTS hosting_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS hosting_canceled_at    timestamptz,
  ADD COLUMN IF NOT EXISTS hosting_started_at     timestamptz;

CREATE INDEX IF NOT EXISTS profiles_has_hosting_idx ON public.profiles(has_hosting) WHERE has_hosting = true;

-- ---- themes: slug + analytics cache --------------------------------------
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS slug          text,
  ADD COLUMN IF NOT EXISTS published_at  timestamptz,
  ADD COLUMN IF NOT EXISTS unpublished_at timestamptz,
  ADD COLUMN IF NOT EXISTS view_count    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

-- Slug uniqueness — case-insensitive, only enforced when slug is set.
CREATE UNIQUE INDEX IF NOT EXISTS themes_slug_unique
  ON public.themes (LOWER(slug))
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS themes_published_lookup_idx
  ON public.themes (slug)
  WHERE is_published = true;

-- Cheap slug shape check (3-40 chars, lowercase letters/digits/hyphens, no
-- leading/trailing hyphen, no double hyphen).
-- Slug shape: 3-40 chars, lowercase alphanumeric + hyphens, must start and
-- end with alphanumeric. App-level validator enforces the rest (no double
-- hyphen, reserved-word block, profanity).
ALTER TABLE public.themes
  DROP CONSTRAINT IF EXISTS themes_slug_shape;
ALTER TABLE public.themes
  ADD CONSTRAINT themes_slug_shape
  CHECK (slug IS NULL OR (
    length(slug) BETWEEN 3 AND 40
    AND slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
  ));

-- ---- hosting_subscriptions (Stripe recurring sub mirror) -----------------
CREATE TABLE IF NOT EXISTS public.hosting_subscriptions (
  id                          text PRIMARY KEY,                  -- Stripe subscription id (sub_…)
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  stripe_customer_id          text,
  stripe_price_id             text,
  status                      text NOT NULL,                     -- active|trialing|past_due|canceled|incomplete|unpaid

  currency                    text NOT NULL,
  amount_cents                int NOT NULL,
  interval                    text NOT NULL DEFAULT 'month',
  interval_count              int NOT NULL DEFAULT 1,

  current_period_start        timestamptz,
  current_period_end          timestamptz,
  cancel_at_period_end        boolean NOT NULL DEFAULT false,
  cancel_at                   timestamptz,
  canceled_at                 timestamptz,
  ended_at                    timestamptz,
  trial_start                 timestamptz,
  trial_end                   timestamptz,

  raw_payload                 jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hosting_subscriptions_user_idx
  ON public.hosting_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS hosting_subscriptions_customer_idx
  ON public.hosting_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS hosting_subscriptions_status_idx
  ON public.hosting_subscriptions(status);

CREATE TRIGGER hosting_subscriptions_set_updated_at
  BEFORE UPDATE ON public.hosting_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hosting_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own hosting sub"
  ON public.hosting_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE: service role only (webhook).

-- ---- domains (custom domains per theme) ----------------------------------
CREATE TABLE IF NOT EXISTS public.domains (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id            uuid REFERENCES public.themes(id) ON DELETE SET NULL,

  domain              text NOT NULL,           -- e.g. mycoolstore.com (apex) or www.mycoolstore.com
  vercel_domain_id    text,                    -- Vercel's own id once added
  status              text NOT NULL DEFAULT 'pending_dns'
                      CHECK (status IN ('pending_dns','pending_ssl','live','error','removed')),

  verified_at         timestamptz,
  last_checked_at     timestamptz,
  error_message       text,

  is_primary          boolean NOT NULL DEFAULT false,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS domains_domain_unique
  ON public.domains (LOWER(domain));
CREATE INDEX IF NOT EXISTS domains_user_idx ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS domains_theme_idx ON public.domains(theme_id);
CREATE INDEX IF NOT EXISTS domains_status_idx ON public.domains(status);

CREATE TRIGGER domains_set_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own domains"
  ON public.domains FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own domains"
  ON public.domains FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- INSERT/UPDATE: server route (service role) only — keeps Vercel API in sync.

-- ---- analytics: site_views (lightweight pageview counter) ----------------
CREATE TABLE IF NOT EXISTS public.site_views (
  id            bigserial PRIMARY KEY,
  theme_id      uuid REFERENCES public.themes(id) ON DELETE CASCADE,
  slug          text,
  country       text,
  referrer      text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_views_theme_idx ON public.site_views(theme_id);
CREATE INDEX IF NOT EXISTS site_views_created_idx ON public.site_views(created_at DESC);

ALTER TABLE public.site_views ENABLE ROW LEVEL SECURITY;
-- service role only: pageviews are written from the rendering route and read
-- via admin-only analytics endpoints.

-- ---- enforce_theme_quota: hosting plan also bypasses cap -----------------
-- Pro hosting users are pro_hosting plan and don't need a separate carve-out
-- (already not 'free'). Tighten the message to match the new product.
CREATE OR REPLACE FUNCTION public.enforce_theme_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'profile_missing: cannot create theme — user has no profile'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_plan = 'free' THEN
    IF v_used >= v_limit THEN
      RAISE EXCEPTION
        'trial_limit_reached: free plan allows up to % themes (you have used %). Upgrade to Pro for unlimited generations.',
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
