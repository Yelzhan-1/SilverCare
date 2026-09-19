class NotificationService {
  private hasPermission = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const status = await Notification.requestPermission();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  public showNotification(title: string, body: string, icon = '/vite.svg') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          tag: 'silvercare-alarm',
          requireInteraction: true,
        });
      } catch (e) {
        console.warn('Notification display failed', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
