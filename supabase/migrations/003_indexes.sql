-- ==========================================================
-- PERFORMANCE INDEXES
-- Optimized for high-speed queries, realtime updates and alerts
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_elderly_profiles_user ON elderly_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user ON caregiver_profiles(profile_id);

CREATE INDEX IF NOT EXISTS idx_family_links_elder ON family_links(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_links_caregiver ON family_links(caregiver_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_links_status ON family_links(status);

CREATE INDEX IF NOT EXISTS idx_medications_elder ON medications(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_med ON medication_schedules(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_intakes_med ON medication_intakes(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_intakes_date ON medication_intakes(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_emergency_events_elder ON emergency_events(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON emergency_events(status);
CREATE INDEX IF NOT EXISTS idx_emergency_events_time ON emergency_events(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile ON push_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_elder ON memory_sessions(elderly_profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_elder_date ON daily_plans(elderly_profile_id, date);
