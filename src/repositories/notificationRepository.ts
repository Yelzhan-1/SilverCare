import { storage } from '../services/storage';

const KEY_NOTIFICATION_SETTINGS = 'notifications:settings';

export interface NotificationPreferences {
  medicationAlerts: boolean;
  memoryReminders: boolean;
  safetyAlerts: boolean;
  scheduleReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  birdSongEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  medicationAlerts: true,
  memoryReminders: true,
  safetyAlerts: true,
  scheduleReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
  birdSongEnabled: true,
};

export class NotificationRepository {
  async getPreferences(): Promise<NotificationPreferences> {
    const p = await storage.get<NotificationPreferences>(KEY_NOTIFICATION_SETTINGS);
    if (!p) {
      await storage.set(KEY_NOTIFICATION_SETTINGS, DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    }
    return p;
  }

  async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...data };
    await storage.set(KEY_NOTIFICATION_SETTINGS, updated);
    return updated;
  }
}

export const notificationRepository = new NotificationRepository();
