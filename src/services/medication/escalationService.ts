import { TodayScheduleItem } from '../../types/medication';
import { AlertSeverity } from '../../types/silvercare';
import { alertRepository } from '../../repositories/alertRepository';
import { intakeRepository } from '../../repositories/intakeRepository';
import { audioAlarmService } from '../audioAlarmService';

export type EscalationPhase = 'idle' | 'watching' | 'warning' | 'low' | 'medium' | 'high' | 'resolved';

export interface EscalationSnapshot {
  phase: EscalationPhase;
  item: TodayScheduleItem | null;
  severity: AlertSeverity | null;
  demoFast: boolean;
}

type Listener = (snapshot: EscalationSnapshot) => void;

const NORMAL_MS = { warning: 20_000, low: 20_000, medium: 25_000, high: 30_000 };
const DEMO_MS = { warning: 4_000, low: 4_000, medium: 4_000, high: 4_000 };

function scheduledIso(item: TodayScheduleItem): string {
  const [h, m] = item.time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

class EscalationService {
  private phase: EscalationPhase = 'idle';
  private item: TodayScheduleItem | null = null;
  private severity: AlertSeverity | null = null;
  private demoFast = false;
  private timerId: number | null = null;
  private dispatched = false;
  private listeners = new Set<Listener>();

  getSnapshot(): EscalationSnapshot {
    return { phase: this.phase, item: this.item, severity: this.severity, demoFast: this.demoFast };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private delays() {
    return this.demoFast ? DEMO_MS : NORMAL_MS;
  }

  private clearTimer() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  watch(item: TodayScheduleItem, opts?: { demoFast?: boolean }) {
    if (this.item?.id === item.id && this.phase !== 'idle' && this.phase !== 'resolved') {
      return;
    }
    this.clearTimer();
    this.item = item;
    this.phase = 'watching';
    this.severity = null;
    this.demoFast = Boolean(opts?.demoFast);
    this.dispatched = false;
    void intakeRepository.upsert({
      doseKey: item.id,
      medicationId: item.medicationId,
      medicationName: item.name,
      scheduledFor: scheduledIso(item),
      status: 'pending',
    });
    this.timerId = window.setTimeout(() => this.enterWarning(), this.delays().warning);
    this.notify();
  }

  markTaken(doseKey: string) {
    if (this.item && this.item.id !== doseKey) return;
    this.clearTimer();
    const item = this.item;
    this.phase = 'resolved';
    this.notify();
    if (item) {
      void intakeRepository.upsert({
        doseKey: item.id,
        medicationId: item.medicationId,
        medicationName: item.name,
        scheduledFor: scheduledIso(item),
        status: 'taken',
        confirmedAt: new Date().toISOString(),
        severity: this.severity,
      });
    }
    this.item = null;
    this.severity = null;
    this.phase = 'idle';
    this.notify();
  }

  markSnoozed(doseKey: string) {
    if (!this.item || this.item.id !== doseKey) return;
    this.clearTimer();
    const item = this.item;
    void intakeRepository.upsert({
      doseKey: item.id,
      medicationId: item.medicationId,
      medicationName: item.name,
      scheduledFor: scheduledIso(item),
      status: 'snoozed',
      snoozeCount: 1,
    });
    this.phase = 'idle';
    this.item = null;
    this.severity = null;
    this.notify();
  }

  private enterWarning() {
    if (this.phase !== 'watching' || !this.item) return;
    this.phase = 'warning';
    audioAlarmService.triggerHaptic([80, 40, 80]);
    void intakeRepository.upsert({
      doseKey: this.item.id,
      medicationId: this.item.medicationId,
      medicationName: this.item.name,
      scheduledFor: scheduledIso(this.item),
      status: 'pending',
      warningAt: new Date().toISOString(),
    });
    this.timerId = window.setTimeout(() => void this.escalate('LOW'), this.delays().low);
    this.notify();
  }

  private async escalate(next: AlertSeverity) {
    if (!this.item) return;
    if (next === 'LOW' && this.phase !== 'warning' && this.phase !== 'watching') return;
    if (next === 'MEDIUM' && this.phase !== 'low') return;
    if (next === 'HIGH' && this.phase !== 'medium') return;

    this.severity = next;
    this.phase = next === 'LOW' ? 'low' : next === 'MEDIUM' ? 'medium' : 'high';
    audioAlarmService.triggerHaptic(next === 'HIGH' ? [200, 80, 200] : 80);

    try {
      const row = await alertRepository.createMedicationAlert(next, {
        doseKey: this.item.id,
        medicationId: this.item.medicationId,
        medicationName: this.item.name,
        reason: 'Приём не подтверждён. Это не вызов скорой.',
        severity: next,
      });
      if (!this.dispatched && (row.status === 'confirmed' || row.status === 'countdown')) {
        this.dispatched = true;
        try {
          await alertRepository.dispatchAlert(row.id);
        } catch (err) {
          console.warn('Missed-med push failed', err);
        }
      }
      void intakeRepository.upsert({
        doseKey: this.item.id,
        medicationId: this.item.medicationId,
        medicationName: this.item.name,
        scheduledFor: scheduledIso(this.item),
        status: 'missed',
        severity: next,
        alertEventId: row.id,
        warningAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Missed-med alert failed', err);
    }

    this.notify();
    if (next === 'LOW') {
      this.timerId = window.setTimeout(() => void this.escalate('MEDIUM'), this.delays().medium);
    } else if (next === 'MEDIUM') {
      this.timerId = window.setTimeout(() => void this.escalate('HIGH'), this.delays().high);
    }
  }
}

export const escalationService = new EscalationService();
