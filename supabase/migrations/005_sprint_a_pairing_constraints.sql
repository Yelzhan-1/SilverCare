-- ==========================================================
-- SPRINT A follow-up: pairing constraints + invite normalize
--
-- 1) One auth user <-> one elderly/caregiver sub-profile.
-- 2) profiles.id must be a real auth.users row (matches auth.uid()).
-- 3) accept_family_invite() strips spaces/dashes so "K7X PQ29" matches.
-- 4) Restrict leftover PUBLIC policies to TO authenticated.
-- Idempotent: safe to re-run.
-- ==========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'elderly_profiles_profile_id_key'
      AND conrelid = 'public.elderly_profiles'::regclass
  ) THEN
    ALTER TABLE public.elderly_profiles
      ADD CONSTRAINT elderly_profiles_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'caregiver_profiles_profile_id_key'
      AND conrelid = 'public.caregiver_profiles'::regclass
  ) THEN
    ALTER TABLE public.caregiver_profiles
      ADD CONSTRAINT caregiver_profiles_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.accept_family_invite(p_invite_code TEXT)
RETURNS TABLE (elder_display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caregiver_id UUID;
  v_link RECORD;
  v_code TEXT;
BEGIN
  v_code := upper(regexp_replace(trim(p_invite_code), '[\s-]+', '', 'g'));

  SELECT id INTO v_caregiver_id
  FROM caregiver_profiles
  WHERE profile_id = auth.uid();

  IF v_caregiver_id IS NULL THEN
    RAISE EXCEPTION 'Текущий аккаунт не является профилем опекуна' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_link
  FROM family_links
  WHERE invite_code = v_code
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Код приглашения не найден или уже использован' USING ERRCODE = 'P0002';
  END IF;

  UPDATE family_links
  SET caregiver_profile_id = v_caregiver_id,
      status = 'active',
      accepted_at = now()
  WHERE id = v_link.id;

  RETURN QUERY
  SELECT p.display_name
  FROM profiles p
  JOIN elderly_profiles ep ON ep.profile_id = p.id
  WHERE ep.id = v_link.elderly_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_family_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_family_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_family_invite(text) TO authenticated;

DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
CREATE POLICY "Users can access own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Elder manages own elderly_profiles" ON public.elderly_profiles;
CREATE POLICY "Elder manages own elderly_profiles"
  ON public.elderly_profiles
  FOR ALL
  TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Caregiver manages own caregiver_profiles" ON public.caregiver_profiles;
CREATE POLICY "Caregiver manages own caregiver_profiles"
  ON public.caregiver_profiles
  FOR ALL
  TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Elder can manage own family_links" ON public.family_links;
CREATE POLICY "Elder can manage own family_links"
  ON public.family_links
  FOR ALL
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );
