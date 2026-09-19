-- F: allow elders to persist memory_sessions (game_results already has policies).
-- memory_sessions had RLS on with zero policies, so inserts were silently denied.

GRANT SELECT, INSERT ON public.memory_sessions TO authenticated;

DROP POLICY IF EXISTS "Elder can insert own memory sessions" ON public.memory_sessions;
CREATE POLICY "Elder can insert own memory sessions"
  ON public.memory_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Elder can view own memory sessions" ON public.memory_sessions;
CREATE POLICY "Elder can view own memory sessions"
  ON public.memory_sessions
  FOR SELECT
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Linked caregiver can view memory sessions" ON public.memory_sessions;
CREATE POLICY "Linked caregiver can view memory sessions"
  ON public.memory_sessions
  FOR SELECT
  TO authenticated
  USING (public.is_linked_caregiver(elderly_profile_id));
