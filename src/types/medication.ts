export type MedicationPhotoPreset = 
  | 'pill-white' 
  | 'capsule-red' 
  | 'drops-blue' 
  | 'tablet-yellow' 
  | 'syrup-amber' 
  | 'capsule-blue'
  | 'bottle-heart'
  | 'capsule-green';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // e.g. ["08:00", "14:00"]
  repeatDays: number[]; // [0, 1, 2, 3, 4, 5, 6] for everyday
  photoPreset?: MedicationPhotoPreset;
  customPhotoUrl?: string;
  instructions?: string;
  customAudioUrl?: string; // Recorded family voice message
  customVoiceText?: string; // Custom spoken text
  enabled: boolean;
  createdAt: string;
}

export type MedicationStatus = 'upcoming' | 'taken' | 'missed';

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // "14:00"
  status: MedicationStatus;
  confirmedAt?: string; // "14:02" or ISO timestamp
  date: string; // YYYY-MM-DD
}

export interface TodayScheduleItem {
  id: string; // unique item id for the day: `${medicationId}-${time}-${date}`
  medicationId: string;
  name: string;
  dosage: string;
  time: string; // "14:00"
  status: MedicationStatus;
  confirmedAt?: string;
  photoPreset?: MedicationPhotoPreset;
  customPhotoUrl?: string;
  instructions?: string;
  customAudioUrl?: string;
  customVoiceText?: string;
  isNext?: boolean;
}

export interface MemoryItem {
  id: string;
  emoji: string;
  name: string;
}

export interface MemoryExerciseData {
  id: string;
  studyItems: MemoryItem[];
  targetQuestion: string;
  correctAnswerId: string;
  choices: MemoryItem[];
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  faceIdEnabled: boolean;
  registeredAt: string;
  lastLoginAt?: string;
  customVoiceAudioUrl?: string;
  customVoiceText?: string;
  alarmSoundType?: 'birds' | 'chime';
}

export type FlashcardCategory = 'medication' | 'brain' | 'nature' | 'health';

export interface MemoryFlashcard {
  id: string;
  category: FlashcardCategory;
  categoryTitle: string;
  question: string;
  questionEmoji?: string;
  hint?: string;
  answer: string;
  explanation: string;
  tags?: string[];
}

