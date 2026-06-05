-- Atomic view_count + last_viewed_at increment for /s/[slug] hits.
-- Called fire-and-forget from the public render route; a missing RPC is
-- handled by the app falling back to a plain UPDATE, but having this lets
-- both updates land in one round-trip.

CREATE OR REPLACE FUNCTION public.increment_theme_views(p_theme_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.themes
     SET view_count = view_count + 1,
         last_viewed_at = now()
   WHERE id = p_theme_id;
END;
$$;
