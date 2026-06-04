-- =========================================================================
-- Zenya — clean rebuild of public schema
-- Drops every public table and rebuilds the system around:
--   profiles (with trial quota + pro flag)
--   themes (user-created sites)
--   purchases (one-time payment log — replaces subscriptions)
--   stripe_customers, stripe_events (Stripe sync)
--   activity_logs (audit trail for everything users do)
--   scrape_history (AI scrape audit)
--   Session (Shopify OAuth, untouched shape)
-- auth.users is preserved by Supabase. We auto-create matching profiles for
-- every existing auth user and for every future signup via trigger.
-- =========================================================================

-- ---- DROP -----------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.activity_logs    CASCADE;
DROP TABLE IF EXISTS public.brand_assets     CASCADE;
DROP TABLE IF EXISTS public."Session"        CASCADE;
DROP TABLE IF EXISTS public.theme_feedback   CASCADE;
DROP TABLE IF EXISTS public.user_segmentation CASCADE;
DROP TABLE IF EXISTS public.scrape_history   CASCADE;
DROP TABLE IF EXISTS public.subscriptions    CASCADE;
DROP TABLE IF EXISTS public.stripe_customers CASCADE;
DROP TABLE IF EXISTS public.stripe_events    CASCADE;
DROP TABLE IF EXISTS public.themes           CASCADE;
DROP TABLE IF EXISTS public.profiles         CASCADE;
DROP TABLE IF EXISTS public.purchases        CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user()              CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()               CASCADE;
DROP FUNCTION IF EXISTS public.enforce_theme_quota()          CASCADE;
DROP FUNCTION IF EXISTS public.log_event(uuid, text, jsonb)   CASCADE;

-- ---- HELPERS --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---- profiles -------------------------------------------------------------
CREATE TABLE public.profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   text,
  full_name               text,
  avatar_url              text,

  plan                    text NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free','pro_lifetime','admin')),
  is_pro                  boolean NOT NULL DEFAULT false,

  -- Trial quota: free users get N theme generations total.
  trial_themes_limit      int NOT NULL DEFAULT 3,
  trial_themes_used       int NOT NULL DEFAULT 0,

  -- Pro purchase summary (filled by webhook on checkout.session.completed)
  pro_purchased_at        timestamptz,
  pro_amount_cents        int,
  pro_currency            text,
  pro_stripe_session_id   text,

  stripe_customer_id      text,
  last_seen_at            timestamptz,

  consent_terms_v         text,
  consent_terms_at        timestamptz,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_stripe_customer_id_idx ON public.profiles(stripe_customer_id);
CREATE INDEX profiles_plan_idx ON public.profiles(plan);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- INSERT: only through handle_new_user() trigger (SECURITY DEFINER)
-- DELETE: only cascade from auth.users

-- ---- handle_new_user (auto-create profile on signup) ----------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',
             NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for every existing auth.users row so login still works.
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ---- themes ---------------------------------------------------------------
CREATE TABLE public.themes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  template_type   text NOT NULL DEFAULT 'storefront',
  product_name    text NOT NULL,
  product_url     text,

  status          text NOT NULL DEFAULT 'ready'
                  CHECK (status IN ('draft','ready','published','archived')),
  is_published    boolean NOT NULL DEFAULT false,
  published_url   text,

  content         jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX themes_user_id_created_idx ON public.themes(user_id, created_at DESC);
CREATE INDEX themes_published_idx ON public.themes(is_published) WHERE is_published = true;

CREATE TRIGGER themes_set_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own themes"
  ON public.themes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone views published themes"
  ON public.themes FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Quota enforcement: free users blocked at trial_themes_limit, pro users free.
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
        'trial_limit_reached: free plan allows up to % themes (used %). Upgrade to Pro to keep creating.',
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

CREATE TRIGGER themes_enforce_quota
  BEFORE INSERT ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_theme_quota();

-- ---- purchases (one-time Stripe payments) ---------------------------------
CREATE TABLE public.purchases (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  stripe_checkout_session_id      text UNIQUE,
  stripe_payment_intent_id        text UNIQUE,
  stripe_customer_id              text,
  stripe_price_id                 text,

  amount_cents                    int NOT NULL,
  currency                        text NOT NULL,
  tax_amount_cents                int NOT NULL DEFAULT 0,
  tax_country                     text,

  status                          text NOT NULL DEFAULT 'paid'
                                  CHECK (status IN ('pending','paid','refunded','failed')),
  paid_at                         timestamptz,
  refunded_at                     timestamptz,

  raw_payload                     jsonb,

  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX purchases_user_id_idx ON public.purchases(user_id);
CREATE INDEX purchases_stripe_customer_idx ON public.purchases(stripe_customer_id);
CREATE INDEX purchases_status_idx ON public.purchases(status);

CREATE TRIGGER purchases_set_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- INSERT / UPDATE / DELETE: service role only (webhook). No policy = no access for authenticated.

-- ---- stripe_customers -----------------------------------------------------
CREATE TABLE public.stripe_customers (
  customer_id   text PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email         text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stripe_customers_user_id_idx ON public.stripe_customers(user_id);

CREATE TRIGGER stripe_customers_set_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
-- service role only

-- ---- stripe_events (webhook idempotency) ----------------------------------
CREATE TABLE public.stripe_events (
  id            text PRIMARY KEY,
  type          text NOT NULL,
  payload       jsonb NOT NULL,
  processed     boolean NOT NULL DEFAULT false,
  processed_at  timestamptz,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stripe_events_type_idx ON public.stripe_events(type);
CREATE INDEX stripe_events_unprocessed_idx ON public.stripe_events(created_at) WHERE processed = false;

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- service role only

-- ---- activity_logs (everything the user does) -----------------------------
CREATE TABLE public.activity_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_logs_user_id_created_idx ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX activity_logs_event_type_idx ON public.activity_logs(event_type);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- No SELECT policy: users cannot read their own logs (only service role can).

CREATE OR REPLACE FUNCTION public.log_event(
  p_user_id    uuid,
  p_event_type text,
  p_metadata   jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, event_type, metadata)
  VALUES (p_user_id, p_event_type, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

-- ---- scrape_history (AI scrape audit) -------------------------------------
CREATE TABLE public.scrape_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url             text NOT NULL,
  method          text,
  status          text NOT NULL DEFAULT 'success',
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scrape_history_user_id_created_idx ON public.scrape_history(user_id, created_at DESC);

ALTER TABLE public.scrape_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scrape history"
  ON public.scrape_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scrape history"
  ON public.scrape_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---- Session (Shopify OAuth — keep shape, app expects this) ---------------
CREATE TABLE public."Session" (
  id           text PRIMARY KEY,
  shop         text NOT NULL,
  state        text NOT NULL,
  "isOnline"   boolean NOT NULL DEFAULT false,
  scope        text,
  expires      timestamp,
  "accessToken" text NOT NULL,
  "userId"     bigint
);

CREATE INDEX session_shop_idx ON public."Session"(shop);

ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
-- service role only

-- ---- Re-grant the admin user lifetime Pro ---------------------------------
UPDATE public.profiles
   SET plan = 'admin', is_pro = true, pro_purchased_at = now()
 WHERE id = 'c5360871-fb12-4c41-baab-69a0acac651d';
