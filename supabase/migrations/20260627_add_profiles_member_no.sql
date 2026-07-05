-- Human-readable sequential member number alongside the UUID primary key.
-- The UUID (profiles.id) stays the auth identity; member_no is just a friendly
-- label ("Zenya #1, #2, ...") for reading/saving users at a glance. Applied to
-- the live project on 2026-06-27.

-- 1. Sequence that hands out the numbers.
CREATE SEQUENCE IF NOT EXISTS public.profiles_member_no_seq;

-- 2. The column.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_no integer;

-- 3. Backfill existing users in signup order (oldest = #1).
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.profiles
  WHERE member_no IS NULL
)
UPDATE public.profiles p
SET member_no = o.rn
FROM ordered o
WHERE p.id = o.id;

-- 4. Advance the sequence past the highest assigned number so new
--    signups continue where the backfill left off.
SELECT setval(
  'public.profiles_member_no_seq',
  COALESCE((SELECT max(member_no) FROM public.profiles), 0),
  true
);

-- 5. New rows auto-get the next number (handle_new_user inserts no member_no,
--    so this default fires for every future signup).
ALTER TABLE public.profiles
  ALTER COLUMN member_no SET DEFAULT nextval('public.profiles_member_no_seq');

-- 6. Tie sequence lifecycle to the column and enforce integrity.
ALTER SEQUENCE public.profiles_member_no_seq OWNED BY public.profiles.member_no;

ALTER TABLE public.profiles
  ALTER COLUMN member_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_no_key
  ON public.profiles(member_no);
