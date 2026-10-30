-- Editor drafts: what the owner changed in the site editor and has not
-- published yet. Visitors are served themes.content only. The editor saves
-- here as the owner works, and «انشر» merges it into content and clears it.
--
--   draft           the editor's own keys only: the template's content key
--                   (restaurant, services, ...), style_preset,
--                   typography_preset, color_overrides, section_styles. A
--                   publish never touches what the dashboard keeps in content
--                   (the SEO logo, for one). null = nothing unpublished.
--   draft_saved_at  when the draft was last written
--
-- Additive: nothing reads these until the new editor ships.

alter table public.themes add column if not exists draft jsonb;
alter table public.themes add column if not exists draft_saved_at timestamptz;
