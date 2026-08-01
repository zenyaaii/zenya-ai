-- ============================================================================
-- Zenya — Bookings / Reservations capture (v1: capture + owner inbox)
--
-- The eight templates have always shown "احجز / reserve / request a quote"
-- calls-to-action, but the submissions went nowhere: the restaurant `form`
-- provider pointed at a dead `#reservations-form` anchor and the services quote
-- form ran `preventDefault` and threw the data away. This adds the missing
-- backend so a visitor's booking lands somewhere the SITE OWNER can read it.
--
-- Design: rides the exact same slug → theme → owner pipeline the analytics
-- beacon already uses. A public, service-role endpoint (/api/bookings) inserts
-- rows; the owner reads/updates them from /dashboard/bookings under RLS.
--
-- Gating (enforced in app code, not here): bookings are a Pro-plan feature with
-- a one-month free trial. `profiles.bookings_trial_started_at` is stamped the
-- first time a non-Pro owner activates the feature; entitlement =
-- Pro plan OR (trial started AND now < trial start + 30 days).
-- ============================================================================

-- ---- one-month free-trial clock -------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bookings_trial_started_at timestamptz;

COMMENT ON COLUMN public.profiles.bookings_trial_started_at IS
  'When the owner first activated the bookings free trial. NULL = never started. '
  'Entitlement = Pro plan OR now() < this + 30 days. Pro plans ignore this column.';

-- ---- site_bookings: the inbox ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_bookings (
  id             bigserial PRIMARY KEY,
  theme_id       uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,

  -- reservation | appointment | quote | contact
  booking_type   text NOT NULL DEFAULT 'contact'
                 CHECK (booking_type IN ('reservation','appointment','quote','contact')),

  -- contact fields (name + at least one of phone/email enforced in the API)
  name           text NOT NULL,
  phone          text,
  email          text,
  message        text,

  -- structured extras, all nullable — a plain contact request uses none
  party_size     smallint,
  preferred_date date,
  preferred_time text,

  -- lifecycle the owner drives from the dashboard
  status         text NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new','confirmed','cancelled','done')),

  -- provenance (mirrors site_events; cookieless visitor identity)
  source_path    text,
  session_id     text,
  visitor_hash   text,
  country        text,
  is_bot         boolean NOT NULL DEFAULT false,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_bookings_theme_created_idx
  ON public.site_bookings (theme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS site_bookings_theme_status_idx
  ON public.site_bookings (theme_id, status);
-- Owner-facing "new count" badge: only humans, newest first.
CREATE INDEX IF NOT EXISTS site_bookings_new_idx
  ON public.site_bookings (theme_id, created_at DESC)
  WHERE status = 'new' AND is_bot = false;

-- keep updated_at fresh on status changes (reuses the shared trigger fn if it
-- exists; the rebuild migration defines public.set_updated_at()).
DROP TRIGGER IF EXISTS site_bookings_set_updated_at ON public.site_bookings;
CREATE TRIGGER site_bookings_set_updated_at
  BEFORE UPDATE ON public.site_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- RLS -------------------------------------------------------------------
-- INSERT is service-role only (the public /api/bookings endpoint), so there is
-- deliberately NO insert policy for anon/authenticated. The owner may read and
-- update the STATUS of bookings that belong to a theme they own; everything
-- else is invisible to them, exactly like one user's analytics is invisible to
-- another.
ALTER TABLE public.site_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_bookings_owner_select ON public.site_bookings;
CREATE POLICY site_bookings_owner_select
  ON public.site_bookings FOR SELECT TO authenticated
  USING (
    theme_id IN (SELECT id FROM public.themes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS site_bookings_owner_update ON public.site_bookings;
CREATE POLICY site_bookings_owner_update
  ON public.site_bookings FOR UPDATE TO authenticated
  USING (
    theme_id IN (SELECT id FROM public.themes WHERE user_id = auth.uid())
  )
  WITH CHECK (
    theme_id IN (SELECT id FROM public.themes WHERE user_id = auth.uid())
  );
