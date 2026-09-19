import { storage } from '../services/storage';
import {
  Profile,
  ElderlyProfile,
  CaregiverProfile,
  UserRole,
  SupportedLanguage,
} from '../types/silvercare';

const KEY_PROFILE = 'user:profile';
const KEY_ELDERLY = 'user:elderly_profile';
const KEY_CAREGIVER = 'user:caregiver_profile';
const KEY_ACTIVE_ROLE = 'user:active_role';

const DEFAULT_ELDER_PROFILE: Profile = {
  id: 'SC-ELDER-8F42A1',
  role: 'elderly',
  displayName: 'Анна Павловна',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  faceVerificationEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_ELDER_SETTINGS: ElderlyProfile = {
  id: 'SC-ELDER-SETTINGS-1',
  profileId: 'SC-ELDER-8F42A1',
  dateOfBirth: '1948-05-12',
  preferredLanguage: 'ru',
  largeTextEnabled: true,
  highContrastEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  voiceBirdAlarmEnabled: true,
  customVoiceText: 'Мама, не забудь принять лекарство, пожалуйста!',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_CAREGIVER: CaregiverProfile = {
  id: 'SC-CAREGIVER-001',
  profileId: 'SC-USER-ALEXEY',
  relationship: 'son',
  relationshipTitle: 'Сын Алексей',
  phone: '+7 (701) 555-01-92',
  email: 'alexey@silvercare.family',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export class UserRepository {
  async getProfile(): Promise<Profile> {
    const p = await storage.get<Profile>(KEY_PROFILE);
    if (!p) {
      await storage.set(KEY_PROFILE, DEFAULT_ELDER_PROFILE);
      return DEFAULT_ELDER_PROFILE;
    }
    return p;
  }

  async updateProfile(profile: Partial<Profile>): Promise<Profile> {
    const current = await this.getProfile();
    const updated: Profile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(KEY_PROFILE, updated);
    return updated;
  }

  async getElderlySettings(): Promise<ElderlyProfile> {
    const settings = await storage.get<ElderlyProfile>(KEY_ELDERLY);
    if (!settings) {
      await storage.set(KEY_ELDERLY, DEFAULT_ELDER_SETTINGS);
      return DEFAULT_ELDER_SETTINGS;
    }
    return settings;
  }

  async updateElderlySettings(settings: Partial<ElderlyProfile>): Promise<ElderlyProfile> {
    const current = await this.getElderlySettings();
    const updated: ElderlyProfile = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(KEY_ELDERLY, updated);
    return updated;
  }

  async getCaregiverProfile(): Promise<CaregiverProfile> {
    const c = await storage.get<CaregiverProfile>(KEY_CAREGIVER);
    if (!c) {
      await storage.set(KEY_CAREGIVER, DEFAULT_CAREGIVER);
      return DEFAULT_CAREGIVER;
    }
    return c;
  }

  async updateCaregiverProfile(data: Partial<CaregiverProfile>): Promise<CaregiverProfile> {
    const current = await this.getCaregiverProfile();
    const updated: CaregiverProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await storage.set(KEY_CAREGIVER, updated);
    return updated;
  }

  async getActiveRole(): Promise<UserRole> {
    const role = await storage.get<UserRole>(KEY_ACTIVE_ROLE);
    return role || 'elderly';
  }

  async setActiveRole(role: UserRole): Promise<void> {
    await storage.set(KEY_ACTIVE_ROLE, role);
  }

  async getLanguage(): Promise<SupportedLanguage> {
    const s = await this.getElderlySettings();
    return s.preferredLanguage || 'ru';
  }

  async setLanguage(lang: SupportedLanguage): Promise<void> {
    await this.updateElderlySettings({ preferredLanguage: lang });
  }
}

export const userRepository = new UserRepository();
