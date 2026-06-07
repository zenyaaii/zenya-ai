-- =========================================================================
-- Zenya — per-user image gallery
-- =========================================================================
-- Every image the user uploads (or chooses to keep) gets a row here so the
-- editor can present a "your gallery" picker instead of a raw URL field.
-- Images themselves still live in the `theme-uploads` storage bucket; this
-- table is metadata + the canonical list.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  url         text NOT NULL,           -- public URL (CDN or external)
  path        text,                    -- storage object key when hosted by us
  name        text,                    -- original filename / display name
  mime        text,
  bytes       int,
  width       int,
  height      int,
  source      text NOT NULL DEFAULT 'upload'
              CHECK (source IN ('upload','theme','external')),

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_images_user_recent_idx
  ON public.gallery_images(user_id, created_at DESC);

-- Same URL can't appear twice for the same user — dedupes the "save to
-- gallery" path when a theme references the same asset more than once.
CREATE UNIQUE INDEX IF NOT EXISTS gallery_images_user_url_unique
  ON public.gallery_images(user_id, url);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gallery"
  ON public.gallery_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own gallery"
  ON public.gallery_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own gallery"
  ON public.gallery_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
