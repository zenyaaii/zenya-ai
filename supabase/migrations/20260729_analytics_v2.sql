-- ============================================================================
-- Analytics v2 — real visitor analytics for Zenya-hosted customer sites.
--
-- Before this migration `site_views` held 7 columns (theme_id, slug, country,
-- referrer, user_agent, created_at) and every read pulled up to 10k raw rows
-- into Node to aggregate in JavaScript. Three concrete problems:
--
--   1. `referrer` was NULL on 100% of live rows — the server-side `referer`
--      header is stripped on most social / in-app navigations, so the whole
--      "top sources" panel was dead. The browser knows the referrer; the
--      server does not. Fixed by the client beacon (see /api/track).
--   2. Bots (Googlebot, Google-Site-Verification, curl) were counted as real
--      customers, inflating every tile. Now classified at write time.
--   3. No session or visitor identity, so unique visitors / bounce rate /
--      engaged time / conversions were all impossible.
--
-- This adds the missing columns, a `site_events` table for conversion actions
-- (WhatsApp taps, phone taps, bookings), and SQL rollup functions so counting
-- happens in Postgres instead of in the API route.
--
-- Privacy: no cookies, no cross-site identifiers, no raw IP is ever stored.
-- `visitor_hash` is a salted digest that rotates daily, so the same person on
-- two different days is two different hashes and cannot be tracked over time.
-- ============================================================================

-- ---- site_views: the missing dimensions -----------------------------------

ALTER TABLE public.site_views
  ADD COLUMN IF NOT EXISTS path          text,
  ADD COLUMN IF NOT EXISTS visitor_hash  text,
  ADD COLUMN IF NOT EXISTS session_id    text,
  ADD COLUMN IF NOT EXISTS is_bot        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referrer_host text,
  ADD COLUMN IF NOT EXISTS channel       text,
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS device        text,
  ADD COLUMN IF NOT EXISTS browser       text,
  ADD COLUMN IF NOT EXISTS os            text,
  ADD COLUMN IF NOT EXISTS engaged_ms    integer,
  ADD COLUMN IF NOT EXISTS scroll_pct    smallint,
  ADD COLUMN IF NOT EXISTS is_entry      boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.site_views.path IS
  'Normalised page path within the site: ''/'' for home, ''/menu'' for a sub-page.';
COMMENT ON COLUMN public.site_views.visitor_hash IS
  'Cookieless, daily-rotating salted hash. Never reversible to an IP.';
COMMENT ON COLUMN public.site_views.is_bot IS
  'Classified at write time from the user-agent. Excluded from owner-facing counts by default.';
COMMENT ON COLUMN public.site_views.engaged_ms IS
  'Milliseconds the tab was actually visible. Written by the unload beacon; NULL for no-JS hits.';

-- Backfill `path` from the historical `slug` column. Sub-pages were recorded
-- as "<site-slug>/<page-slug>" — the data was always there, just never split.
UPDATE public.site_views
   SET path = CASE
                WHEN slug IS NULL THEN NULL
                WHEN position('/' in slug) = 0 THEN '/'
                ELSE '/' || substring(slug from position('/' in slug) + 1)
              END
 WHERE path IS NULL;

-- Backfill bot classification over existing rows so historical tiles stop
-- counting Googlebot as a customer.
UPDATE public.site_views
   SET is_bot = true
 WHERE is_bot = false
   AND user_agent IS NOT NULL
   AND user_agent ~* '(bot|crawl|spider|slurp|curl|wget|headless|monitor|preview|fetch|python-requests|axios|node-fetch|lighthouse|pingdom|uptime|semrush|ahrefs|facebookexternalhit|site-verification)';

CREATE INDEX IF NOT EXISTS site_views_theme_created_idx
  ON public.site_views (theme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS site_views_session_idx
  ON public.site_views (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS site_views_human_idx
  ON public.site_views (theme_id, created_at DESC) WHERE is_bot = false;

-- ---- site_events: the conversions that actually matter ---------------------
-- For an Arabic SMB brochure site, "did somebody tap WhatsApp" IS the business
-- metric. Those links exist in every template and were never measured.

CREATE TABLE IF NOT EXISTS public.site_events (
  id           bigserial PRIMARY KEY,
  theme_id     uuid REFERENCES public.themes(id) ON DELETE CASCADE,
  session_id   text,
  visitor_hash text,
  -- whatsapp_click | phone_click | email_click | booking_click | map_click
  -- | form_submit | outbound_click | social_click | order_click
  event_type   text NOT NULL,
  label        text,
  path         text,
  country      text,
  device       text,
  is_bot       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_events_theme_created_idx
  ON public.site_events (theme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_type_idx
  ON public.site_events (theme_id, event_type);

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role only, exactly like site_views. Events are written
-- by /api/track and read by the owner-scoped analytics API.

-- ============================================================================
-- Rollup functions. All aggregation lives here so the API route never pulls
-- raw rows. Every function is scoped by an explicit theme-id array that the
-- API builds from the signed-in user's own themes — ownership is enforced in
-- the route before these are ever called.
-- ============================================================================

-- ---- totals ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_totals(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_include_bots boolean DEFAULT false
)
RETURNS TABLE (
  views            bigint,
  sessions         bigint,
  visitors         bigint,
  bounced_sessions bigint,
  engaged_ms_total bigint,
  engaged_samples  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH rows AS (
    SELECT *
      FROM public.site_views v
     WHERE v.theme_id = ANY(p_theme_ids)
       AND v.created_at >= p_from
       AND v.created_at <  p_to
       AND (p_include_bots OR v.is_bot = false)
  ),
  per_session AS (
    SELECT session_id, count(*) AS hits
      FROM rows
     WHERE session_id IS NOT NULL
     GROUP BY session_id
  )
  SELECT
    (SELECT count(*) FROM rows)::bigint,
    (SELECT count(DISTINCT session_id) FROM rows WHERE session_id IS NOT NULL)::bigint,
    (SELECT count(DISTINCT visitor_hash) FROM rows WHERE visitor_hash IS NOT NULL)::bigint,
    (SELECT count(*) FROM per_session WHERE hits = 1)::bigint,
    (SELECT coalesce(sum(engaged_ms), 0) FROM rows WHERE engaged_ms IS NOT NULL)::bigint,
    (SELECT count(*) FROM rows WHERE engaged_ms IS NOT NULL)::bigint;
$$;

-- ---- daily series ---------------------------------------------------------
-- Buckets by the OWNER's local day, not UTC. A Gulf business at +03 should see
-- "Friday" mean their Friday.
CREATE OR REPLACE FUNCTION public.analytics_daily(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_include_bots boolean DEFAULT false,
  p_tz           text    DEFAULT 'UTC'
)
RETURNS TABLE (
  day      date,
  views    bigint,
  sessions bigint,
  visitors bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    (v.created_at AT TIME ZONE p_tz)::date          AS day,
    count(*)::bigint                                AS views,
    count(DISTINCT v.session_id)::bigint            AS sessions,
    count(DISTINCT v.visitor_hash)::bigint          AS visitors
    FROM public.site_views v
   WHERE v.theme_id = ANY(p_theme_ids)
     AND v.created_at >= p_from
     AND v.created_at <  p_to
     AND (p_include_bots OR v.is_bot = false)
   GROUP BY 1
   ORDER BY 1;
$$;

-- ---- generic breakdown ----------------------------------------------------
-- One function for every "top N" table: country, referrer_host, channel,
-- device, browser, os, path, utm_source, utm_campaign, template.
CREATE OR REPLACE FUNCTION public.analytics_breakdown(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_dimension    text,
  p_include_bots boolean DEFAULT false,
  p_limit        integer DEFAULT 12
)
RETURNS TABLE (
  name     text,
  views    bigint,
  sessions bigint,
  visitors bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Whitelist the column: p_dimension reaches this from a query string, so it
  -- is never interpolated without passing through this CASE first.
  IF p_dimension NOT IN (
    'country','referrer_host','channel','device','browser','os',
    'path','utm_source','utm_medium','utm_campaign'
  ) THEN
    RAISE EXCEPTION 'unsupported dimension: %', p_dimension;
  END IF;

  RETURN QUERY EXECUTE format($q$
    SELECT
      coalesce(nullif(v.%1$I, ''), 'unknown')::text,
      count(*)::bigint,
      count(DISTINCT v.session_id)::bigint,
      count(DISTINCT v.visitor_hash)::bigint
      FROM public.site_views v
     WHERE v.theme_id = ANY($1)
       AND v.created_at >= $2
       AND v.created_at <  $3
       AND ($4 OR v.is_bot = false)
     GROUP BY 1
     ORDER BY 2 DESC
     LIMIT $5
  $q$, p_dimension)
  USING p_theme_ids, p_from, p_to, p_include_bots, p_limit;
END;
$$;

-- ---- per-site rollup ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_by_site_range(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_include_bots boolean DEFAULT false
)
RETURNS TABLE (
  theme_id uuid,
  views    bigint,
  sessions bigint,
  visitors bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.theme_id,
    count(*)::bigint,
    count(DISTINCT v.session_id)::bigint,
    count(DISTINCT v.visitor_hash)::bigint
    FROM public.site_views v
   WHERE v.theme_id = ANY(p_theme_ids)
     AND v.created_at >= p_from
     AND v.created_at <  p_to
     AND (p_include_bots OR v.is_bot = false)
   GROUP BY 1;
$$;

-- ---- page performance -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_pages(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_include_bots boolean DEFAULT false,
  p_limit        integer DEFAULT 20
)
RETURNS TABLE (
  path         text,
  views        bigint,
  visitors     bigint,
  avg_engaged  numeric,
  avg_scroll   numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    coalesce(nullif(v.path, ''), '/')::text,
    count(*)::bigint,
    count(DISTINCT v.visitor_hash)::bigint,
    round(avg(v.engaged_ms) FILTER (WHERE v.engaged_ms IS NOT NULL))::numeric,
    round(avg(v.scroll_pct) FILTER (WHERE v.scroll_pct IS NOT NULL))::numeric
    FROM public.site_views v
   WHERE v.theme_id = ANY(p_theme_ids)
     AND v.created_at >= p_from
     AND v.created_at <  p_to
     AND (p_include_bots OR v.is_bot = false)
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT p_limit;
$$;

-- ---- hour × weekday heatmap ----------------------------------------------
-- "When do my customers actually visit" — the most actionable chart a
-- restaurant owner can have, and impossible before this migration.
CREATE OR REPLACE FUNCTION public.analytics_hourly(
  p_theme_ids    uuid[],
  p_from         timestamptz,
  p_to           timestamptz,
  p_include_bots boolean DEFAULT false,
  p_tz           text    DEFAULT 'UTC'
)
RETURNS TABLE (
  dow   smallint,
  hour  smallint,
  views bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    extract(dow  from v.created_at AT TIME ZONE p_tz)::smallint,
    extract(hour from v.created_at AT TIME ZONE p_tz)::smallint,
    count(*)::bigint
    FROM public.site_views v
   WHERE v.theme_id = ANY(p_theme_ids)
     AND v.created_at >= p_from
     AND v.created_at <  p_to
     AND (p_include_bots OR v.is_bot = false)
   GROUP BY 1, 2;
$$;

-- ---- conversions ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.analytics_events(
  p_theme_ids uuid[],
  p_from      timestamptz,
  p_to        timestamptz
)
RETURNS TABLE (
  event_type text,
  events     bigint,
  sessions   bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    e.event_type::text,
    count(*)::bigint,
    count(DISTINCT e.session_id)::bigint
    FROM public.site_events e
   WHERE e.theme_id = ANY(p_theme_ids)
     AND e.created_at >= p_from
     AND e.created_at <  p_to
     AND e.is_bot = false
   GROUP BY 1
   ORDER BY 2 DESC;
$$;

-- Which page drives the conversions.
CREATE OR REPLACE FUNCTION public.analytics_events_by_path(
  p_theme_ids uuid[],
  p_from      timestamptz,
  p_to        timestamptz,
  p_limit     integer DEFAULT 10
)
RETURNS TABLE (
  path   text,
  events bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    coalesce(nullif(e.path, ''), '/')::text,
    count(*)::bigint
    FROM public.site_events e
   WHERE e.theme_id = ANY(p_theme_ids)
     AND e.created_at >= p_from
     AND e.created_at <  p_to
     AND e.is_bot = false
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT p_limit;
$$;

-- ---- daily conversions (for the trend line) -------------------------------
CREATE OR REPLACE FUNCTION public.analytics_events_daily(
  p_theme_ids uuid[],
  p_from      timestamptz,
  p_to        timestamptz,
  p_tz        text DEFAULT 'UTC'
)
RETURNS TABLE (
  day    date,
  events bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    (e.created_at AT TIME ZONE p_tz)::date,
    count(*)::bigint
    FROM public.site_events e
   WHERE e.theme_id = ANY(p_theme_ids)
     AND e.created_at >= p_from
     AND e.created_at <  p_to
     AND e.is_bot = false
   GROUP BY 1
   ORDER BY 1;
$$;

-- ---- lock the functions down ----------------------------------------------
-- These are SECURITY DEFINER and take an arbitrary theme-id array, so they
-- must never be callable by anon/authenticated over PostgREST. Ownership is
-- checked in the API route, which calls them with the service role.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'analytics_totals(uuid[],timestamptz,timestamptz,boolean)',
    'analytics_daily(uuid[],timestamptz,timestamptz,boolean,text)',
    'analytics_breakdown(uuid[],timestamptz,timestamptz,text,boolean,integer)',
    'analytics_by_site_range(uuid[],timestamptz,timestamptz,boolean)',
    'analytics_pages(uuid[],timestamptz,timestamptz,boolean,integer)',
    'analytics_hourly(uuid[],timestamptz,timestamptz,boolean,text)',
    'analytics_events(uuid[],timestamptz,timestamptz)',
    'analytics_events_by_path(uuid[],timestamptz,timestamptz,integer)',
    'analytics_events_daily(uuid[],timestamptz,timestamptz,text)'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END;
$$;
