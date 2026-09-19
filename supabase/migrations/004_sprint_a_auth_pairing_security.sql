-- ==========================================================
-- SPRINT A: Auth + roles + secure invite pairing
--
-- Context: the live project already had ad-hoc policies for
-- elderly_profiles / caregiver_profiles / family_links (added directly,
-- not through a committed migration) by the time this file was written.
-- In particular, family_links had:
--
--   CREATE POLICY "Caregiver can view and accept family_links"
--     ON family_links FOR ALL
--     USING (
--       caregiver_profile_id IN (SELECT id FROM caregiver_profiles WHERE profile_id = auth.uid())
--       OR status = 'pending'
--     );
--
-- The `OR status = 'pending'` clause (with no `TO` role restriction) let
-- ANY caller -- including anon, over the public REST API -- read and
-- mutate EVERY pending invite in the system: every elder's invite code
-- and family structure was exposed. This migration removes that policy
-- and replaces the "accept an invite" flow with a SECURITY DEFINER RPC
-- that validates the exact code server-side instead of requiring a
-- broad SELECT policy. It also pins search_path on SECURITY DEFINER
-- helpers and adds read policies a linked caregiver needs to see the
-- elder's display name.
--
-- Idempotent: safe to re-run.
-- Applied live via Supabase MCP on 2026-09-19 (see list_migrations:
-- 20260919220247_sprint_a_auth_pairing_security).
-- ==========================================================

-- 1) Harden is_linked_caregiver: pin search_path (fixes the
--    function_search_path_mutable advisor warning). Restrict EXECUTE to
--    authenticated only -- anon should never be able to call it directly
--    (it's meant to be used from inside RLS policies for signed-in users).
CREATE OR REPLACE FUNCTION public.is_linked_caregiver(elder_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_links fl
    JOIN caregiver_profiles cp ON fl.caregiver_profile_id = cp.id
    WHERE fl.elderly_profile_id = elder_id
      AND cp.profile_id = auth.uid()
      AND fl.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_linked_caregiver(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_linked_caregiver(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_linked_caregiver(uuid) TO authenticated;

-- 2) Fix family_links: drop the over-permissive policy described above and
--    replace it with one that only ever exposes a caregiver's OWN
--    (already-linked) rows via normal SELECT.
DROP POLICY IF EXISTS "Caregiver can view and accept family_links" ON public.family_links;
DROP POLICY IF EXISTS "Caregiver can view own family_links" ON public.family_links;

CREATE POLICY "Caregiver can view own family_links"
  ON public.family_links
  FOR SELECT
  TO authenticated
  USING (
    caregiver_profile_id IN (
      SELECT id FROM caregiver_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );

-- (Elder can manage own family_links -- INSERT/SELECT/UPDATE/DELETE on rows
-- they own -- already exists from an earlier direct change and is left
-- untouched here.)

-- 3) Let a linked caregiver read the elder's base profile + elderly_profiles
--    row (needed to show "Связаны с <имя>" on the caregiver dashboard,
--    without a broad profiles policy that would expose everyone's names).
DROP POLICY IF EXISTS "Linked caregiver can view elder base profile" ON public.profiles;
CREATE POLICY "Linked caregiver can view elder base profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ep.profile_id FROM elderly_profiles ep
      WHERE public.is_linked_caregiver(ep.id)
    )
  );

DROP POLICY IF EXISTS "Linked caregiver can view elder profile" ON public.elderly_profiles;
CREATE POLICY "Linked caregiver can view elder profile"
  ON public.elderly_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_linked_caregiver(id));

-- 4) accept_family_invite(): the ONLY supported way to redeem an invite
--    code. SECURITY DEFINER so it can look up the exact pending row by
--    code (bypassing the now-restrictive family_links SELECT policy), but
--    the function body itself enforces authorization: the caller must
--    already own a caregiver_profiles row, and only the single matching
--    pending row (locked FOR UPDATE to avoid a race between two
--    simultaneous accepts of the same code) is ever touched.
CREATE OR REPLACE FUNCTION public.accept_family_invite(p_invite_code TEXT)
RETURNS TABLE (elder_display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caregiver_id UUID;
  v_link RECORD;
BEGIN
  SELECT id INTO v_caregiver_id
  FROM caregiver_profiles
  WHERE profile_id = auth.uid();

  IF v_caregiver_id IS NULL THEN
    RAISE EXCEPTION 'Текущий аккаунт не является профилем опекуна' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_link
  FROM family_links
  WHERE invite_code = upper(trim(p_invite_code))
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

-- ==========================================================
-- Known residual advisor notes (accepted, not fixed here — out of Sprint A
-- scope since the current UI doesn't touch these tables yet):
--   * RLS enabled, no policy (INFO): daily_plans, daily_tasks,
--     emergency_settings, medication_schedules, memory_results,
--     memory_sessions, schedules, voice_profiles. These tables are fully
--     inaccessible until a future sprint adds policies for them.
--   * "Signed-in users can execute SECURITY DEFINER function" (WARN) for
--     is_linked_caregiver / accept_family_invite: intentional — both are
--     designed to be called by `authenticated` (the former from inside RLS
--     policies, the latter directly via supabase.rpc()).
-- ==========================================================
