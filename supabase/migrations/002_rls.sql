-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant privacy: elders see own data, caregivers see linked elders
-- ==========================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current auth user is linked caregiver to elder
CREATE OR REPLACE FUNCTION is_linked_caregiver(elder_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_links fl
    JOIN caregiver_profiles cp ON fl.caregiver_profile_id = cp.id
    WHERE fl.elderly_profile_id = elder_id
      AND cp.profile_id = auth.uid()
      AND fl.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can access own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Medications: Elder can manage, linked caregiver can view and insert
CREATE POLICY "Elder can manage medications"
  ON medications FOR ALL
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid()));

CREATE POLICY "Linked caregiver can view and manage medications"
  ON medications FOR ALL
  USING (is_linked_caregiver(elderly_profile_id));

-- Medication Intakes
CREATE POLICY "Elder can view and update intakes"
  ON medication_intakes FOR ALL
  USING (medication_id IN (
    SELECT m.id FROM medications m
    JOIN elderly_profiles ep ON m.elderly_profile_id = ep.id
    WHERE ep.profile_id = auth.uid()
  ));

CREATE POLICY "Caregiver can view intakes"
  ON medication_intakes FOR SELECT
  USING (medication_id IN (
    SELECT m.id FROM medications m
    WHERE is_linked_caregiver(m.elderly_profile_id)
  ));

-- Emergency Events: Realtime access for both
CREATE POLICY "Elder can trigger emergency events"
  ON emergency_events FOR ALL
  USING (elderly_profile_id IN (SELECT id FROM elderly_profiles WHERE profile_id = auth.uid()));

CREATE POLICY "Caregiver can view and acknowledge emergency events"
  ON emergency_events FOR ALL
  USING (is_linked_caregiver(elderly_profile_id));
