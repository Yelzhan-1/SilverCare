import { audioAlarmService } from '../audioAlarmService';
import { pushService } from './pushService';

export interface ToastAlert {
  id: string;
  title: string;
  body: string;
  type: 'medicine' | 'emergency' | 'info' | 'success';
}

type ToastListener = (toast: ToastAlert | null) => void;

class NotificationService {
  private toastListeners: Set<ToastListener> = new Set();
  private audioUnlocked = false;

  subscribeToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }

  subscribe(listener: (toast: ToastAlert) => void): () => void {
    const wrapped: ToastListener = (t) => {
      if (t) listener(t);
    };
    this.toastListeners.add(wrapped);
    return () => this.toastListeners.delete(wrapped);
  }

  unlockAudio() {
    this.audioUnlocked = true;
    audioAlarmService.playChime();
  }

  isAudioUnlocked(): boolean {
    return this.audioUnlocked;
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    // 1. In-app toast for immediate visibility in any context / iframe
    const toast: ToastAlert = {
      id: `toast-${Date.now()}`,
      title,
      body: options.body || '',
      type: (options.tag as any) || 'info',
    };
    this.toastListeners.forEach((l) => l(toast));
    setTimeout(() => {
      this.toastListeners.forEach((l) => l(null));
    }, 6000);

    // 2. System Web Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const swOptions: any = {
              icon: '/medications/pill-white.png',
              badge: '/medications/pill-white.png',
              vibrate: [200, 100, 200],
              ...options,
            };
            await reg.showNotification(title, swOptions);
            return true;
          }
        }
        new Notification(title, options);
        return true;
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
    return false;
  }

  async sendMedicationReminder(medicationName: string, dosage: string): Promise<void> {
    audioAlarmService.playBirdsSong();
    await this.showNotification(`💊 Пора принять ${medicationName}`, {
      body: `${dosage}. Нажмите, чтобы подтвердить приём в 1 клик.`,
      tag: 'medicine',
    });
  }

  async sendEmergencyAlert(elderName: string, reason: string): Promise<void> {
    audioAlarmService.playEmergencyChime();
    await this.showNotification(`🚨 SilverCare: Тревога!`, {
      body: `${elderName} не подтвердила состояние (${reason}). Проверьте близкого!`,
      tag: 'emergency',
    });
  }

  async sendTestNotification(): Promise<boolean> {
    audioAlarmService.playChime();
    audioAlarmService.triggerHaptic(50);
    return this.showNotification('🔔 SilverCare: Тестовое уведомление', {
      body: 'Уведомления и звуковой сигнал работают отлично!',
      tag: 'success',
    });
  }
}

export const notificationService = new NotificationService();
