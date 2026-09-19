-- ==========================================================
-- SPRINT D+F: medication intake sync, missed-med severity,
--             memory pair game results
-- Idempotent. RPCs are SECURITY INVOKER — RLS stays in charge.
-- ==========================================================

-- D: severity on emergency_events (SOS rows stay NULL)
ALTER TABLE public.emergency_events
  ADD COLUMN IF NOT EXISTS severity TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'emergency_events_severity_check'
      AND conrelid = 'public.emergency_events'::regclass
  ) THEN
    ALTER TABLE public.emergency_events DROP CONSTRAINT emergency_events_severity_check;
  END IF;
END $$;

ALTER TABLE public.emergency_events
  ADD CONSTRAINT emergency_events_severity_check
  CHECK (severity IS NULL OR severity = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text]));

CREATE INDEX IF NOT EXISTS emergency_events_type_triggered_idx
  ON public.emergency_events (type, triggered_at DESC);

-- D: intake_logs — sync doses without requiring medications UUID catalog
CREATE TABLE IF NOT EXISTS public.intake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES public.elderly_profiles(id) ON DELETE CASCADE,
  dose_key TEXT NOT NULL,
  medication_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status = ANY (ARRAY['pending'::text, 'taken'::text, 'missed'::text, 'skipped'::text, 'snoozed'::text])),
  snooze_count INT NOT NULL DEFAULT 0,
  warning_at TIMESTAMPTZ,
  severity TEXT CHECK (severity IS NULL OR severity = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])),
  alert_event_id UUID REFERENCES public.emergency_events(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  response_time_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (elderly_profile_id, dose_key)
);

CREATE INDEX IF NOT EXISTS intake_logs_elder_scheduled_idx
  ON public.intake_logs (elderly_profile_id, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS intake_logs_status_idx
  ON public.intake_logs (elderly_profile_id, status);

CREATE INDEX IF NOT EXISTS intake_logs_alert_event_id_idx
  ON public.intake_logs (alert_event_id);

-- F: pair-game results (also keep writing memory_sessions from the client)
CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES public.elderly_profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL DEFAULT 'memory_pairs',
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL
    CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  pairs_total INT NOT NULL,
  pairs_found INT NOT NULL,
  attempts INT NOT NULL,
  duration_seconds INT NOT NULL,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  score INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS game_results_elder_completed_idx
  ON public.game_results (elderly_profile_id, completed_at DESC);

ALTER TABLE public.intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.intake_logs TO authenticated;
GRANT SELECT, INSERT ON public.game_results TO authenticated;

DROP POLICY IF EXISTS "Elder can manage own intake logs" ON public.intake_logs;
CREATE POLICY "Elder can manage own intake logs"
  ON public.intake_logs
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

DROP POLICY IF EXISTS "Linked caregiver can view intake logs" ON public.intake_logs;
CREATE POLICY "Linked caregiver can view intake logs"
  ON public.intake_logs
  FOR SELECT
  TO authenticated
  USING (public.is_linked_caregiver(elderly_profile_id));

DROP POLICY IF EXISTS "Elder can insert own game results" ON public.game_results;
CREATE POLICY "Elder can insert own game results"
  ON public.game_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Elder can view own game results" ON public.game_results;
CREATE POLICY "Elder can view own game results"
  ON public.game_results
  FOR SELECT
  TO authenticated
  USING (
    elderly_profile_id IN (
      SELECT id FROM elderly_profiles WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Linked caregiver can view game results" ON public.game_results;
CREATE POLICY "Linked caregiver can view game results"
  ON public.game_results
  FOR SELECT
  TO authenticated
  USING (public.is_linked_caregiver(elderly_profile_id));

-- Realtime: guardian dashboard listens to missed intakes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'intake_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_logs;
  END IF;
END $$;

ALTER TABLE public.intake_logs REPLICA IDENTITY FULL;

-- One escalating missed-medication alert per dose_key (no SOS countdown)
CREATE OR REPLACE FUNCTION public.create_medication_alert(
  p_severity TEXT,
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
  v_severity TEXT;
  v_dose_key TEXT;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Требуется вход' USING ERRCODE = '42501';
  END IF;

  v_severity := upper(COALESCE(p_severity, 'LOW'));
  IF v_severity NOT IN ('LOW', 'MEDIUM', 'HIGH') THEN
    RAISE EXCEPTION 'Некорректный уровень' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_elder_id
  FROM elderly_profiles
  WHERE profile_id = (SELECT auth.uid());

  IF v_elder_id IS NULL THEN
    RAISE EXCEPTION 'Только подопечный может создать тревогу о приёме' USING ERRCODE = 'P0001';
  END IF;

  v_dose_key := COALESCE(p_metadata->>'doseKey', '');

  IF v_dose_key <> '' THEN
    SELECT * INTO v_row
    FROM emergency_events
    WHERE elderly_profile_id = v_elder_id
      AND type = 'missed_medication'
      AND status NOT IN ('cancelled', 'resolved')
      AND metadata->>'doseKey' = v_dose_key
    ORDER BY triggered_at DESC
    LIMIT 1;

    IF FOUND THEN
      UPDATE emergency_events
      SET severity = v_severity,
          metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
          confirmed_at = COALESCE(confirmed_at, now())
      WHERE id = v_row.id
      RETURNING * INTO v_row;
      RETURN v_row;
    END IF;
  END IF;

  INSERT INTO emergency_events (
    elderly_profile_id,
    type,
    status,
    severity,
    metadata,
    triggered_at,
    confirmed_at
  )
  VALUES (
    v_elder_id,
    'missed_medication',
    'confirmed',
    v_severity,
    COALESCE(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_medication_alert(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_medication_alert(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_medication_alert(text, jsonb) TO authenticated;
