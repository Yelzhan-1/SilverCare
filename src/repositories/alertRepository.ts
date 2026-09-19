/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import type { Json, Tables } from '../types/database.types';

export type AlertRow = Tables<'emergency_events'>;

export const COUNTDOWN_SECONDS = 15;

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export const alertRepository = {
  async createAlert(type: string, metadata: Record<string, unknown> = {}): Promise<AlertRow> {
    const { data, error } = await supabase.rpc('create_alert', {
      p_type: type,
      p_metadata: metadata as Json,
    });
    if (error) throw error;
    if (!data) throw new Error('Не удалось создать тревогу.');
    return data;
  },

  async cancelAlert(eventId: string): Promise<AlertRow> {
    const { data, error } = await supabase.rpc('cancel_alert', { p_event_id: eventId });
    if (error) throw error;
    if (!data) throw new Error('Не удалось отменить тревогу.');
    return data;
  },

  async confirmAlert(eventId: string): Promise<AlertRow> {
    const { data, error } = await supabase.rpc('confirm_alert', { p_event_id: eventId });
    if (error) throw error;
    if (!data) throw new Error('Не удалось подтвердить тревогу.');
    return data;
  },

  async acknowledgeAlert(eventId: string): Promise<AlertRow> {
    const { data, error } = await supabase.rpc('acknowledge_alert', { p_event_id: eventId });
    if (error) throw error;
    if (!data) throw new Error('Не удалось подтвердить тревогу.');
    return data;
  },

  /**
   * Idempotent notify+push. A second call after status=notified does not
   * send another burst of Web Push messages.
   */
  async dispatchAlert(eventId: string): Promise<{ alreadyNotified: boolean; delivered: number }> {
    const { data, error } = await supabase.functions.invoke('emergency-alert', {
      body: { eventId },
    });
    if (error) throw error;
    return {
      alreadyNotified: Boolean(data?.alreadyNotified),
      delivered: Number(data?.delivered ?? 0),
    };
  },

  async confirmAndDispatch(eventId: string): Promise<AlertRow> {
    const row = await alertRepository.confirmAlert(eventId);
    if (['notified', 'acknowledged', 'resolved'].includes(row.status)) {
      return row;
    }
    try {
      await alertRepository.dispatchAlert(eventId);
    } catch (err) {
      console.warn('Push dispatch failed (alert is still confirmed in DB)', err);
    }
    return row;
  },

  async listAlerts(limit = 20): Promise<AlertRow[]> {
    const { data, error } = await supabase
      .from('emergency_events')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  subscribeToAlerts(onChange: (row: AlertRow) => void): () => void {
    const channel = supabase
      .channel('emergency-events-guardian')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_events' },
        (payload) => {
          const row = (payload.new ?? payload.old) as AlertRow | null;
          if (row?.id) onChange(row);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
