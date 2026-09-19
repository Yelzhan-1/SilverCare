export interface PushServiceStatus {
  permission: NotificationPermission | 'unsupported';
  swSupported: boolean;
  pushSupported: boolean;
  isSecureContext: boolean;
  isSubscribed: boolean;
}

export class PushService {
  async getStatus(): Promise<PushServiceStatus> {
    const swSupported = 'serviceWorker' in navigator;
    const pushSupported = 'PushManager' in window;
    const isSecureContext = window.isSecureContext ?? true;
    const permission: NotificationPermission | 'unsupported' =
      'Notification' in window ? Notification.permission : 'unsupported';

    let isSubscribed = false;
    if (swSupported && pushSupported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          isSubscribed = !!sub;
        }
      } catch {
        // Ignored in restricted contexts
      }
    }

    return {
      permission,
      swSupported,
      pushSupported,
      isSecureContext,
      isSubscribed,
    };
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      return reg;
    } catch (e) {
      console.warn('ServiceWorker registration error or sandboxed environment:', e);
      return null;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    const permGranted = await this.requestPermission();
    if (!permGranted) return null;

    const reg = await this.registerServiceWorker();
    if (!reg || !('pushManager' in reg)) return null;

    try {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // For MVP demo, subscription uses demo public key or placeholder
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: new Uint8Array([
            4, 24, 182, 92, 114, 219, 142, 85, 23, 100, 19, 212, 101, 14, 230,
            121, 232, 234, 117, 72, 88, 17, 240, 194, 24, 12, 190, 89, 74, 11,
            240, 111,
          ]),
        });
      }
      return sub;
    } catch (e) {
      console.warn('Push subscription failed (common in iframe/mock environment):', e);
      return null;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
    } catch (e) {
      console.warn('Unsubscribe error:', e);
    }
  }
}

export const pushService = new PushService();
