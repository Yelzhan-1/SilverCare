/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TodayScheduleItem } from '../types/medication';
import { storageService } from './storageService';

const SNOOZE_STORAGE_KEY = 'silvercare_active_snoozes_v1';

/**
 * A snoozed reminder, persisted to localStorage so it survives a page reload
 * AND correctly honors a midnight rollover.
 *
 * We deliberately store an ABSOLUTE `ringAtIso` timestamp (not a relative
 * "5 minutes" countdown) and a full snapshot of the original `item` — this
 * way, even if the app is reloaded well past midnight, we know exactly which
 * dose was snoozed, on which calendar day it was originally due, and what to
 * display when we re-ring — instead of accidentally re-deriving "today's"
 * schedule (which would produce a different item after the date rolls over).
 */
export interface PersistedSnooze {
  /** Stable key: `${medicationId}-${time}-${originalDate}` (same shape as TodayScheduleItem.id) */
  id: string;
  medicationId: string;
  /** "HH:MM" scheduled time */
  time: string;
  /** "YYYY-MM-DD" — the calendar day this dose was originally due */
  originalDate: string;
  /** Absolute ISO timestamp for when the alarm should ring again */
  ringAtIso: string;
  /** Snapshot of the dose as it looked when snoozed, for faithful re-display */
  item: TodayScheduleItem;
}

function readAll(): PersistedSnooze[] {
  try {
    const raw = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to read persisted snoozes', e);
    return [];
  }
}

function writeAll(list: PersistedSnooze[]): void {
  try {
    localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to persist snoozes', e);
  }
}

export const snoozeService = {
  getAll(): PersistedSnooze[] {
    return readAll();
  },

  save(record: PersistedSnooze): void {
    const list = readAll().filter((r) => r.id !== record.id);
    list.push(record);
    writeAll(list);
  },

  remove(id: string): void {
    const list = readAll();
    const next = list.filter((r) => r.id !== id);
    if (next.length !== list.length) {
      writeAll(next);
    }
  },

  /**
   * Was the dose behind this snooze record actually confirmed while it was
   * snoozed (e.g. tapped directly from the list, or on another tab)? We check
   * the durable medication logs — keyed by medicationId + scheduledTime +
   * originalDate — rather than the ephemeral "today" schedule, so this stays
   * correct across a midnight rollover.
   */
  isAlreadyTaken(record: PersistedSnooze): boolean {
    return storageService
      .getLogs()
      .some(
        (l) =>
          l.medicationId === record.medicationId &&
          l.scheduledTime === record.time &&
          l.date === record.originalDate &&
          l.status === 'taken'
      );
  },
};
