-- Show the rebuilt welcome tour once more to every owner (owner's request,
-- 2026-10-11). The tour had been unmounted since 2026-09-13; this clears the
-- "seen" flag so it asks again on each owner's next dashboard visit. The
-- browser-side key moved to zenya_welcome_seen_v3 in the same change.
update public.profiles set welcome_tour_seen = false where welcome_tour_seen = true;
