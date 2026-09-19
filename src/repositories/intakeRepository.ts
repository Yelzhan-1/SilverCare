/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { authRepository } from './authRepository';
import type { Tables, TablesInsert } from '../types/database.types';
import type { AlertSeverity, MedicationIntakeStatus } from '../types/silvercare';

export type IntakeLogRow = Tables<'intake_logs'>;

export interface IntakeUpsertInput {
  doseKey: string;
  medicationId: string;
  medicationName: string;
  scheduledFor: string;
  status: MedicationIntakeStatus;
  snoozeCount?: number;
  warningAt?: string | null;
  severity?: AlertSeverity | null;
  alertEventId?: string | null;
  confirmedAt?: string | null;
  responseTimeSeconds?: number | null;
}

async function resolveElderId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const elder = await authRepository.getMyElderlyProfile(data.user.id);
  return elder?.id ?? null;
}

function toPatch(input: IntakeUpsertInput): Omit<TablesInsert<'intake_logs'>, 'elderly_profile_id'> {
  return {
    dose_key: input.doseKey,
    medication_id: input.medicationId,
    medication_name: input.medicationName,
    scheduled_for: input.scheduledFor,
    status: input.status,
    snooze_count: input.snoozeCount ?? 0,
    warning_at: input.warningAt ?? null,
    severity: input.severity ?? null,
    alert_event_id: input.alertEventId ?? null,
    confirmed_at: input.confirmedAt ?? null,
    response_time_seconds: input.responseTimeSeconds ?? null,
    updated_at: new Date().toISOString(),
  };
}

export const intakeRepository = {
  async upsert(input: IntakeUpsertInput): Promise<IntakeLogRow | null> {
    const elderId = await resolveElderId();
    if (!elderId) return null;

    const row = { ...toPatch(input), elderly_profile_id: elderId };
    const { data, error } = await supabase
      .from('intake_logs')
      .upsert(row, { onConflict: 'elderly_profile_id,dose_key' })
      .select('*')
      .maybeSingle();
    if (error) {
      console.warn('intake upsert failed', error.message);
      return null;
    }
    return data;
  },

  async listRecent(limit = 20): Promise<IntakeLogRow[]> {
    const { data, error } = await supabase
      .from('intake_logs')
      .select('*')
      .order('scheduled_for', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async listMisses(limit = 10): Promise<IntakeLogRow[]> {
    const { data, error } = await supabase
      .from('intake_logs')
      .select('*')
      .eq('status', 'missed')
      .order('scheduled_for', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  subscribe(onChange: (row: IntakeLogRow) => void): () => void {
    const channel = supabase
      .channel('intake-logs-guardian')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intake_logs' },
        (payload) => {
          const row = (payload.new ?? payload.old) as IntakeLogRow | null;
          if (row?.id) onChange(row);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
