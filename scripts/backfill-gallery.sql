-- Walk every theme.content for image URLs and upsert into gallery_images.
-- Only inserts URLs that look like real image assets, scoped to the
-- owner of each theme.

WITH bodies AS (
  SELECT user_id, content::text AS body
  FROM public.themes
  WHERE content IS NOT NULL
),
extracted AS (
  SELECT
    user_id,
    (regexp_matches(body, '"(https?://[^"\\]+?)"', 'g'))[1] AS url
  FROM bodies
),
filtered AS (
  SELECT DISTINCT user_id, url
  FROM extracted
  WHERE url ~* '\.(jpe?g|png|webp|gif|avif|svg)(\?|$)'
     OR url ~* '://(images|plus)\.unsplash\.com'
     OR url ~* '://res\.cloudinary\.com'
     OR url ~* '://cdn\.shopify\.com'
     OR url ~* '\.supabase\.co/storage/v1/object/public/'
)
INSERT INTO public.gallery_images (user_id, url, source)
SELECT user_id, url, 'theme'
FROM filtered
ON CONFLICT (user_id, url) DO NOTHING
RETURNING user_id, url;
