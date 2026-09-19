import { Medication, MedicationLog, TodayScheduleItem, UserProfile } from '../types/medication';
import { INITIAL_MEDICATIONS } from '../data/initialMedications';

const STORAGE_KEYS = {
  MEDICATIONS: 'silvercare_medications_v3',
  LOGS: 'silvercare_medication_logs_v3',
  SETTINGS: 'silvercare_settings_v3',
  USER_PROFILE: 'silvercare_user_profile_v2',
};

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormattedRussianDate = (date: Date = new Date()): string => {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

export const storageService = {
  getMedications(): Medication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      if (!data) {
        // First launch: initialize default demo medications
        localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(INITIAL_MEDICATIONS));
        this.initializeDefaultLogs();
        return INITIAL_MEDICATIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load medications from storage', e);
      return INITIAL_MEDICATIONS;
    }
  },

  saveMedications(meds: Medication[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(meds));
    } catch (e) {
      console.error('Failed to save medications', e);
    }
  },

  addMedication(med: Omit<Medication, 'id' | 'createdAt'>): Medication {
    const meds = this.getMedications();
    const newMed: Medication = {
      ...med,
      id: 'med-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    meds.push(newMed);
    this.saveMedications(meds);
    return newMed;
  },

  getLogs(): MedicationLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!data) {
        return this.initializeDefaultLogs();
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load logs', e);
      return [];
    }
  },

  saveLogs(logs: MedicationLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  },

  initializeDefaultLogs(): MedicationLog[] {
    const today = getTodayDateKey();
    const defaultLogs: MedicationLog[] = [
      {
        id: `log-amlodipine-0800-${today}`,
        medicationId: 'med-amlodipine',
        scheduledTime: '08:00',
        status: 'taken',
        confirmedAt: '08:02',
        date: today,
      },
      {
        id: `log-vitamin-d-1200-${today}`,
        medicationId: 'med-vitamin-d',
        scheduledTime: '12:00',
        status: 'taken',
        confirmedAt: '12:01',
        date: today,
      },
      // Note: 14:00 (Метформин) & 20:00 (Лозартан) are left as upcoming for demonstration!
    ];
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(defaultLogs));
    } catch (e) {
      console.error('Failed to init logs', e);
    }
    return defaultLogs;
  },

  markMedicationTaken(medicationId: string, scheduledTime: string): MedicationLog {
    const today = getTodayDateKey();
    const logs = this.getLogs();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const confirmedTime = `${hours}:${minutes}`;

    const existingIndex = logs.findIndex(
      (l) => l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === today
    );

    let updatedLog: MedicationLog;
    if (existingIndex >= 0) {
      updatedLog = {
        ...logs[existingIndex],
        status: 'taken',
        confirmedAt: confirmedTime,
      };
      logs[existingIndex] = updatedLog;
    } else {
      updatedLog = {
        id: `log-${medicationId}-${scheduledTime.replace(':', '')}-${today}`,
        medicationId,
        scheduledTime,
        status: 'taken',
        confirmedAt: confirmedTime,
        date: today,
      };
      logs.push(updatedLog);
    }

    this.saveLogs(logs);
    return updatedLog;
  },

  getTodaySchedule(): TodayScheduleItem[] {
    const meds = this.getMedications().filter((m) => m.enabled);
    const logs = this.getLogs();
    const today = getTodayDateKey();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const items: TodayScheduleItem[] = [];

    meds.forEach((med) => {
      med.times.forEach((time) => {
        const [h, m] = time.split(':').map(Number);
        const medMinutes = h * 60 + m;

        // Check if log exists for today
        const log = logs.find(
          (l) => l.medicationId === med.id && l.scheduledTime === time && l.date === today
        );

        let status: 'taken' | 'upcoming' | 'missed' = 'upcoming';
        let confirmedAt: string | undefined = undefined;

        if (log && log.status === 'taken') {
          status = 'taken';
          confirmedAt = log.confirmedAt;
        } else if (medMinutes < currentMinutes - 60) {
          // If more than 60 minutes past scheduled time without confirmation, show missed
          status = 'missed';
        } else {
          status = 'upcoming';
        }

        items.push({
          id: `${med.id}-${time}-${today}`,
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          time,
          status,
          confirmedAt,
          photoPreset: med.photoPreset,
          customPhotoUrl: med.customPhotoUrl,
          instructions: med.instructions,
          customAudioUrl: med.customAudioUrl,
          customVoiceText: med.customVoiceText,
        });
      });
    });

    // Sort by scheduled time ascending
    items.sort((a, b) => a.time.localeCompare(b.time));

    // Find first upcoming item to mark as isNext
    const nextItem = items.find((i) => i.status === 'upcoming');
    if (nextItem) {
      nextItem.isNext = true;
    }

    return items;
  },

  resetDemoState(): void {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(INITIAL_MEDICATIONS));
    this.initializeDefaultLogs();
  },

  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.alarmSoundType) {
          parsed.alarmSoundType = 'birds';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load user profile', e);
    }
    // Default initial profile
    const defaultProfile: UserProfile = {
      name: 'Анна Ивановна',
      avatarUrl: '', // empty means generated/preset avatar or prompt for Face ID
      faceIdEnabled: true,
      alarmSoundType: 'birds',
      customVoiceText: 'Мамочка, пожалуйста, прими лекарство вовремя!',
      registeredAt: new Date().toISOString(),
    };
    return defaultProfile;
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },
};
