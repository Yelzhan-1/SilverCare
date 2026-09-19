import { emergencyRepository } from '../../repositories/emergencyRepository';
import { EmergencyEvent, EmergencyEventType, EmergencyEventStatus } from '../../types/silvercare';
import { audioAlarmService } from '../audioAlarmService';

export type EmergencyStateMachineState =
  | 'NORMAL'
  | 'REMINDER'
  | 'WAITING_FOR_RESPONSE'
  | 'COUNTDOWN'
  | 'ALERT_CREATED'
  | 'CAREGIVER_NOTIFIED'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface EmergencySnapshot {
  event: EmergencyEvent | null;
  state: EmergencyStateMachineState;
  remainingSeconds: number;
}

type EmergencyListener = (snapshot: EmergencySnapshot) => void;

class EmergencyService {
  private currentState: EmergencyStateMachineState = 'NORMAL';
  private activeEvent: EmergencyEvent | null = null;
  private timerId: number | null = null;
  private targetTimestamp: number | null = null;
  private remainingSeconds: number = 0;
  private listeners: Set<EmergencyListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    try {
      this.broadcastChannel = new BroadcastChannel('silvercare_emergency_channel');
      this.broadcastChannel.onmessage = (msg) => {
        if (msg.data?.type === 'SYNC_EMERGENCY') {
          this.syncFromBroadcast(msg.data.event, msg.data.state);
        }
      };
    } catch {
      // BroadcastChannel might not be supported in some embedded iframes
    }
  }

  getSnapshot(): EmergencySnapshot {
    return {
      event: this.activeEvent,
      state: this.currentState,
      remainingSeconds: this.remainingSeconds,
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
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SYNC_EMERGENCY',
          event: this.activeEvent,
          state: this.currentState,
        });
      } catch {
        // silent fallback
      }
    }
  }

  private syncFromBroadcast(event: EmergencyEvent | null, state: EmergencyStateMachineState) {
    this.activeEvent = event;
    this.currentState = state;
    this.notify();
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

  /**
   * Start 45s countdown (or custom seconds for demo)
   */
  async startCountdown(type: EmergencyEventType = 'missed_medication', metadata?: EmergencyEvent['metadata'], seconds = 45): Promise<void> {
    this.stopTimer();

    const event = await emergencyRepository.createEvent(type, metadata);
    this.activeEvent = event;
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
        this.transitionToAlertCreated();
      } else {
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  private async transitionToAlertCreated() {
    if (!this.activeEvent) return;
    this.currentState = 'ALERT_CREATED';
    this.activeEvent = await emergencyRepository.updateEventStatus(this.activeEvent.id, 'notified');
    this.currentState = 'CAREGIVER_NOTIFIED';

    audioAlarmService.playEmergencyChime();
    audioAlarmService.triggerHaptic([500, 200, 500, 200, 500]);

    this.notify();
  }

  /**
   * Senior pressed "✅ ДА, Я В ПОРЯДКЕ"
   */
  async cancelEmergency(): Promise<void> {
    this.stopTimer();
    if (this.activeEvent) {
      await emergencyRepository.updateEventStatus(this.activeEvent.id, 'cancelled');
    }
    this.activeEvent = null;
    this.currentState = 'CANCELLED';
    this.remainingSeconds = 0;
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(50);

    this.notify();

    setTimeout(() => {
      this.currentState = 'NORMAL';
      this.notify();
    }, 2000);
  }

  /**
   * Senior pressed "🆘 МНЕ НУЖНА ПОМОЩЬ"
   */
  async triggerManualSos(reason = 'Экстренный вызов от пользователя'): Promise<void> {
    this.stopTimer();
    const event = await emergencyRepository.createEvent('manual_sos', { reason });
    this.activeEvent = event;
    await emergencyRepository.updateEventStatus(event.id, 'notified');
    this.currentState = 'CAREGIVER_NOTIFIED';

    audioAlarmService.playEmergencyChime();
    audioAlarmService.triggerHaptic([500, 200, 500, 200, 500]);
    this.notify();
  }

  /**
   * Fall detection demo
   */
  async triggerFallDetectionDemo(): Promise<void> {
    await this.startCountdown('fall_detection', { reason: 'Обнаружено резкое изменение положения (симуляция)' }, 20);
  }

  /**
   * Caregiver pressed "✅ Я занимаюсь ситуацией"
   */
  async acknowledgeByCaregiver(caregiverName = 'Сын Алексей'): Promise<void> {
    if (this.activeEvent) {
      this.activeEvent = await emergencyRepository.updateEventStatus(this.activeEvent.id, 'acknowledged', {
        acknowledgedBy: caregiverName,
      });
      this.currentState = 'ACKNOWLEDGED';
      audioAlarmService.playSuccessChime();
      this.notify();
    }
  }

  /**
   * Caregiver or system marks emergency resolved
   */
  async resolveEmergency(): Promise<void> {
    this.stopTimer();
    if (this.activeEvent) {
      await emergencyRepository.updateEventStatus(this.activeEvent.id, 'resolved');
    }
    this.activeEvent = null;
    this.currentState = 'RESOLVED';
    this.notify();

    setTimeout(() => {
      this.currentState = 'NORMAL';
      this.notify();
    }, 1500);
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
