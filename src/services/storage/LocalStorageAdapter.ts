import { StorageAdapter } from './StorageAdapter';

const STORAGE_VERSION = 'silvercare:v1';
const PREFIX = 'silvercare:';

export class LocalStorageAdapter implements StorageAdapter {
  private versionKey = `${PREFIX}version`;

  constructor() {
    this.initMigrations();
  }

  private initMigrations() {
    try {
      const currentVersion = localStorage.getItem(this.versionKey);
      if (!currentVersion) {
        // First initialization
        localStorage.setItem(this.versionKey, STORAGE_VERSION);
      } else if (currentVersion !== STORAGE_VERSION) {
        this.migrate(currentVersion, STORAGE_VERSION);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or restricted:', e);
    }
  }

  private migrate(oldVersion: string, newVersion: string) {
    console.info(`[SilverCare Storage] Migrating storage from ${oldVersion} to ${newVersion}`);
    localStorage.setItem(this.versionKey, newVersion);
  }

  private formatKey(key: string): string {
    return key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const formatted = this.formatKey(key);
      const raw = localStorage.getItem(formatted);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`Error reading key "${key}" from LocalStorage:`, e);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const formatted = this.formatKey(key);
      localStorage.setItem(formatted, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing key "${key}" to LocalStorage:`, e);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const formatted = this.formatKey(key);
      localStorage.removeItem(formatted);
    } catch (e) {
      console.error(`Error removing key "${key}" from LocalStorage:`, e);
    }
  }

  async clear(): Promise<void> {
    try {
      // Safe clear: ONLY clear keys that belong to silvercare
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(PREFIX)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(this.versionKey, STORAGE_VERSION);
    } catch (e) {
      console.error('Error clearing SilverCare LocalStorage:', e);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    } catch {
      return [];
    }
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
