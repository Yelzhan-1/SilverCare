import { storage } from '../services/storage';
import {
  EmergencySettings,
  EmergencyEvent,
  EmergencyEventType,
  EmergencyEventStatus,
} from '../types/silvercare';

const KEY_SETTINGS = 'emergency:settings';
const KEY_EVENTS = 'emergency:events';
const KEY_ACTIVE_EVENT = 'emergency:active_event';

const DEFAULT_SETTINGS: EmergencySettings = {
  id: 'em-settings-1',
  elderlyProfileId: 'SC-ELDER-8F42A1',
  enabled: true,
  responseTimeoutSeconds: 45,
  notifyCaregivers: true,
  demoMode: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export class EmergencyRepository {
  async getSettings(): Promise<EmergencySettings> {
    const s = await storage.get<EmergencySettings>(KEY_SETTINGS);
    if (!s) {
      await storage.set(KEY_SETTINGS, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return s;
  }

  async updateSettings(data: Partial<EmergencySettings>): Promise<EmergencySettings> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(KEY_SETTINGS, updated);
    return updated;
  }

  async getEvents(): Promise<EmergencyEvent[]> {
    const list = await storage.get<EmergencyEvent[]>(KEY_EVENTS);
    return list || [];
  }

  async getActiveEvent(): Promise<EmergencyEvent | null> {
    return storage.get<EmergencyEvent>(KEY_ACTIVE_EVENT);
  }

  async createEvent(
    type: EmergencyEventType,
    metadata?: EmergencyEvent['metadata']
  ): Promise<EmergencyEvent> {
    const event: EmergencyEvent = {
      id: `em-evt-${Date.now()}`,
      elderlyProfileId: 'SC-ELDER-8F42A1',
      type,
      status: 'countdown',
      triggeredAt: new Date().toISOString(),
      metadata,
    };

    await storage.set(KEY_ACTIVE_EVENT, event);

    const history = await this.getEvents();
    history.unshift(event);
    await storage.set(KEY_EVENTS, history.slice(0, 50));

    return event;
  }

  async updateEventStatus(
    eventId: string,
    status: EmergencyEventStatus,
    extra?: { acknowledgedBy?: string; reason?: string }
  ): Promise<EmergencyEvent | null> {
    const active = await this.getActiveEvent();
    const now = new Date().toISOString();

    let updatedEvent: EmergencyEvent | null = null;

    if (active && active.id === eventId) {
      updatedEvent = {
        ...active,
        status,
        acknowledgedBy: extra?.acknowledgedBy || active.acknowledgedBy,
        cancelledAt: status === 'cancelled' ? now : active.cancelledAt,
        resolvedAt: status === 'resolved' ? now : active.resolvedAt,
      };

      if (status === 'resolved' || status === 'cancelled') {
        await storage.remove(KEY_ACTIVE_EVENT);
      } else {
        await storage.set(KEY_ACTIVE_EVENT, updatedEvent);
      }
    }

    const history = await this.getEvents();
    const idx = history.findIndex((e) => e.id === eventId);
    if (idx >= 0) {
      history[idx] = {
        ...history[idx],
        status,
        cancelledAt: status === 'cancelled' ? now : history[idx].cancelledAt,
        resolvedAt: status === 'resolved' ? now : history[idx].resolvedAt,
        acknowledgedBy: extra?.acknowledgedBy || history[idx].acknowledgedBy,
      };
      await storage.set(KEY_EVENTS, history);
    }

    return updatedEvent;
  }

  async clearActiveEvent(): Promise<void> {
    await storage.remove(KEY_ACTIVE_EVENT);
  }
}

export const emergencyRepository = new EmergencyRepository();
