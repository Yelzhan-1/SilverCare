import { EmergencyEvent, EmergencyEventType } from '../../types/silvercare';
import { audioAlarmService } from '../audioAlarmService';
import {
  alertRepository,
  COUNTDOWN_SECONDS,
  isOnline,
  type AlertRow,
} from '../../repositories/alertRepository';

export type EmergencyStateMachineState =
  | 'NORMAL'
  | 'REMINDER'
  | 'WAITING_FOR_RESPONSE'
  | 'COUNTDOWN'
  | 'ALERT_CREATED'
  | 'CAREGIVER_NOTIFIED'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'OFFLINE';

export interface EmergencySnapshot {
  event: EmergencyEvent | null;
  state: EmergencyStateMachineState;
  remainingSeconds: number;
  online: boolean;
  lastError: string | null;
}

type EmergencyListener = (snapshot: EmergencySnapshot) => void;

function toUiEvent(row: AlertRow): EmergencyEvent {
  const metadata = (row.metadata ?? {}) as EmergencyEvent['metadata'];
  return {
    id: row.id,
    elderlyProfileId: row.elderly_profile_id,
    type: row.type as EmergencyEventType,
    status: row.status as EmergencyEvent['status'],
    triggeredAt: row.triggered_at ?? new Date().toISOString(),
    cancelledAt: row.cancelled_at ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    acknowledgedBy: row.acknowledged_by ?? undefined,
    metadata,
  };
}

class EmergencyService {
  private currentState: EmergencyStateMachineState = 'NORMAL';
  private activeEvent: EmergencyEvent | null = null;
  private timerId: number | null = null;
  private targetTimestamp: number | null = null;
  private remainingSeconds = 0;
  private listeners: Set<EmergencyListener> = new Set();
  private lastError: string | null = null;
  private dispatching = false;

  getSnapshot(): EmergencySnapshot {
    return {
      event: this.activeEvent,
      state: this.currentState,
      remainingSeconds: this.remainingSeconds,
      online: isOnline(),
      lastError: this.lastError,
    };
  }

  subscribe(listener: EmergencyListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((l) => l(snapshot));
  }

  getState(): EmergencyStateMachineState {
    return this.currentState;
  }

  getActiveEvent(): EmergencyEvent | null {
    return this.activeEvent;
  }

  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  async startCountdown(
    type: EmergencyEventType = 'manual_sos',
    metadata?: EmergencyEvent['metadata'],
    seconds = COUNTDOWN_SECONDS
  ): Promise<void> {
    this.stopTimer();
    this.lastError = null;

    if (!isOnline()) {
      this.currentState = 'OFFLINE';
      this.lastError = 'Нет сети — онлайн-уведомления недоступны.';
      this.notify();
      return;
    }

    try {
      const row = await alertRepository.createAlert(type, metadata ?? {});
      this.activeEvent = toUiEvent(row);
      this.currentState = 'COUNTDOWN';
      this.remainingSeconds = seconds;
      this.targetTimestamp = Date.now() + seconds * 1000;

      audioAlarmService.playEmergencyChime();
      audioAlarmService.triggerHaptic([300, 150, 300]);

      this.timerId = window.setInterval(() => {
        if (!this.targetTimestamp) return;
        const diff = Math.max(0, Math.ceil((this.targetTimestamp - Date.now()) / 1000));
        this.remainingSeconds = diff;
        if (diff <= 0) {
          this.stopTimer();
          void this.confirmAndNotify();
        } else {
          this.notify();
        }
      }, 1000);

      this.notify();
    } catch (err) {
      this.currentState = 'OFFLINE';
      this.lastError = err instanceof Error ? err.message : 'Не удалось создать тревогу.';
      this.notify();
    }
  }

  private async confirmAndNotify(): Promise<void> {
    if (!this.activeEvent || this.dispatching) return;
    this.dispatching = true;
    this.currentState = 'ALERT_CREATED';
    this.notify();

    if (!isOnline()) {
      this.currentState = 'OFFLINE';
      this.lastError = 'Нет сети — уведомление опекуну не отправлено.';
      this.dispatching = false;
      this.notify();
      return;
    }

    try {
      const row = await alertRepository.confirmAndDispatch(this.activeEvent.id);
      this.activeEvent = toUiEvent(row);
      this.currentState = 'CAREGIVER_NOTIFIED';
      audioAlarmService.playEmergencyChime();
      audioAlarmService.triggerHaptic([500, 200, 500, 200, 500]);
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : 'Не удалось отправить уведомление.';
      this.currentState = 'OFFLINE';
    } finally {
      this.dispatching = false;
      this.notify();
    }
  }

  async cancelEmergency(): Promise<void> {
    this.stopTimer();
    if (this.activeEvent) {
      try {
        const row = await alertRepository.cancelAlert(this.activeEvent.id);
        this.activeEvent = toUiEvent(row);
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : 'Не удалось отменить тревогу.';
      }
    }
    this.currentState = 'CANCELLED';
    this.remainingSeconds = 0;
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(50);
    this.notify();

    setTimeout(() => {
      this.activeEvent = null;
      this.currentState = 'NORMAL';
      this.notify();
    }, 2000);
  }

  async triggerManualSos(reason = 'Подопечный нажал «Нужна помощь»'): Promise<void> {
    this.stopTimer();
    if (!this.activeEvent) {
      await this.startCountdown('manual_sos', { reason }, 0);
    }
    await this.confirmAndNotify();
  }

  async triggerFallDetectionDemo(): Promise<void> {
    await this.startCountdown(
      'fall_detection',
      { reason: 'Демо: симуляция падения (не медицинский диагноз)' },
      COUNTDOWN_SECONDS
    );
  }

  async acknowledgeByCaregiver(): Promise<void> {
    if (!this.activeEvent) return;
    try {
      const row = await alertRepository.acknowledgeAlert(this.activeEvent.id);
      this.activeEvent = toUiEvent(row);
      this.currentState = 'ACKNOWLEDGED';
      audioAlarmService.playSuccessChime();
      this.notify();
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : 'Не удалось подтвердить.';
      this.notify();
    }
  }

  applyRemoteEvent(row: AlertRow): void {
    this.activeEvent = toUiEvent(row);
    if (row.status === 'acknowledged') this.currentState = 'ACKNOWLEDGED';
    else if (row.status === 'notified' || row.status === 'confirmed') this.currentState = 'CAREGIVER_NOTIFIED';
    else if (row.status === 'cancelled') this.currentState = 'CANCELLED';
    else if (row.status === 'resolved') this.currentState = 'RESOLVED';
    else if (row.status === 'countdown') this.currentState = 'COUNTDOWN';
    this.notify();
  }

  clear(): void {
    this.stopTimer();
    this.activeEvent = null;
    this.currentState = 'NORMAL';
    this.lastError = null;
    this.notify();
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.targetTimestamp = null;
  }
}

export const emergencyService = new EmergencyService();
