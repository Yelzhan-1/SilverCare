-- ==========================================================
-- SPRINT B+C: alert state machine + realtime + push RLS
-- Idempotent. RPCs are SECURITY INVOKER — RLS stays in charge.
-- ==========================================================

ALTER TABLE public.emergency_events
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'emergency_events_status_check'
      AND conrelid = 'public.emergency_events'::regclass
  ) THEN
    ALTER TABLE public.emergency_events DROP CONSTRAINT emergency_events_status_check;
  END IF;
END $$;

ALTER TABLE public.emergency_events
  ADD CONSTRAINT emergency_events_status_check
  CHECK (status = ANY (ARRAY[
    'created'::text,
    'countdown'::text,
    'cancelled'::text,
    'confirmed'::text,
    'notified'::text,
    'acknowledged'::text,
    'resolved'::text,
    'pending'::text
  ]));

CREATE INDEX IF NOT EXISTS emergency_events_elder_triggered_idx
  ON public.emergency_events (elderly_profile_id, triggered_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'push_subscriptions_endpoint_key'
      AND conrelid = 'public.push_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
  END IF;
END $$;

-- Realtime: guardian dashboard listens to emergency_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'emergency_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_events;
  END IF;
END $$;

ALTER TABLE public.emergency_events REPLICA IDENTITY FULL;

-- RLS: authenticated only, ownership predicates, WITH CHECK on writes
DROP POLICY IF EXISTS "Elder can trigger emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "Elder can manage own emergency events" ON public.emergency_events;
CREATE POLICY "Elder can manage own emergency events"
  ON public.emergency_events
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

DROP POLICY IF EXISTS "Caregiver can view and acknowledge emergency events" ON public.emergency_events;
DROP POLICY IF EXISTS "Linked caregiver can view emergency events" ON public.emergency_events;
CREATE POLICY "Linked caregiver can view emergency events"
  ON public.emergency_events
  FOR SELECT
  TO authenticated
  USING (public.is_linked_caregiver(elderly_profile_id));

DROP POLICY IF EXISTS "Linked caregiver can acknowledge emergency events" ON public.emergency_events;
CREATE POLICY "Linked caregiver can acknowledge emergency events"
  ON public.emergency_events
  FOR UPDATE
  TO authenticated
  USING (public.is_linked_caregiver(elderly_profile_id))
  WITH CHECK (public.is_linked_caregiver(elderly_profile_id));

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- ---- RPCs (SECURITY INVOKER) --------------------------------------------

CREATE OR REPLACE FUNCTION public.create_alert(
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.emergency_events
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_elder_id UUID;
  v_row public.emergency_events;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Требуется вход' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_elder_id
  FROM elderly_profiles
  WHERE profile_id = (SELECT auth.uid());

  IF v_elder_id IS NULL THEN
    RAISE EXCEPTION 'Только подопечный может создать тревогу' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO emergency_events (elderly_profile_id, type, status, metadata, triggered_at)
  VALUES (
    v_elder_id,
    COALESCE(p_type, 'manual_sos'),
    'countdown',
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_alert(p_event_id UUID)
RETURNS public.emergency_events
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.emergency_events;
BEGIN
  UPDATE emergency_events
  SET status = 'cancelled',
      cancelled_at = now()
  WHERE id = p_event_id
    AND status IN ('created', 'countdown')
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT * INTO v_row FROM emergency_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Тревога не найдена' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_alert(p_event_id UUID)
RETURNS public.emergency_events
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.emergency_events;
BEGIN
  UPDATE emergency_events
  SET status = 'confirmed',
      confirmed_at = now()
  WHERE id = p_event_id
    AND status IN ('created', 'countdown')
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT * INTO v_row FROM emergency_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Тревога не найдена' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_alert(p_event_id UUID)
RETURNS public.emergency_events
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.emergency_events;
BEGIN
  UPDATE emergency_events
  SET status = 'acknowledged',
      acknowledged_at = now(),
      acknowledged_by = COALESCE(acknowledged_by, (SELECT auth.uid())::text)
  WHERE id = p_event_id
    AND status IN ('confirmed', 'notified')
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT * INTO v_row FROM emergency_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Тревога не найдена' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_alert(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_alert(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_alert(text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_alert(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_alert(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_alert(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_alert(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_alert(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirm_alert(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.acknowledge_alert(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_alert(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_alert(uuid) TO authenticated;
