-- ==========================================================
-- SILVERCARE DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Production-ready schema for elderly medication, memory and safety
-- ==========================================================

-- 1. Profiles (base user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('elderly', 'caregiver')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  face_verification_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Elderly Profiles (specific settings for senior)
CREATE TABLE IF NOT EXISTS elderly_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'ru',
  large_text_enabled BOOLEAN DEFAULT TRUE,
  high_contrast_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Caregiver Profiles
CREATE TABLE IF NOT EXISTS caregiver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('son', 'daughter', 'grandson', 'granddaughter', 'relative', 'caregiver', 'other')),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Family Links (secure pairing between elder and caregiver)
CREATE TABLE IF NOT EXISTS family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  caregiver_profile_id UUID NOT NULL REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked')) DEFAULT 'pending',
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- 5. Medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  unit TEXT DEFAULT 'таблетка',
  instructions TEXT,
  color TEXT DEFAULT '#007AFF',
  icon TEXT DEFAULT 'pill',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Medication Schedules
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  days_of_week INT[] DEFAULT '{0,1,2,3,4,5,6}',
  enabled BOOLEAN DEFAULT TRUE,
  grace_period_seconds INT DEFAULT 900,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medication Intakes (logs)
CREATE TABLE IF NOT EXISTS medication_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'missed', 'skipped')) DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  response_time_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Emergency Settings
CREATE TABLE IF NOT EXISTS emergency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  response_timeout_seconds INT DEFAULT 45,
  notify_caregivers BOOLEAN DEFAULT TRUE,
  demo_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Emergency Events
CREATE TABLE IF NOT EXISTS emergency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('missed_medication', 'manual_sos', 'fall_detection', 'inactivity')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'countdown', 'cancelled', 'notified', 'resolved')) DEFAULT 'pending',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB
);

-- 10. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Memory Sessions & Results
CREATE TABLE IF NOT EXISTS memory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy',
  score INT NOT NULL,
  duration_seconds INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES memory_sessions(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  correct_answers INT NOT NULL,
  total_answers INT NOT NULL,
  score INT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Daily Plans & Tasks
CREATE TABLE IF NOT EXISTS daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  memory_minutes INT DEFAULT 3,
  attention_minutes INT DEFAULT 2,
  logic_minutes INT DEFAULT 2,
  orientation_minutes INT DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- 13. Schedules (My Day items)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

-- 14. Voice Profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elderly_profile_id UUID NOT NULL REFERENCES elderly_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('family_voice', 'assistant_voice')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
