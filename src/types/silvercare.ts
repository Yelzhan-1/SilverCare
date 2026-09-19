export type UserRole = 'elderly' | 'caregiver';

export type SupportedLanguage = 'ru' | 'kz' | 'en';

export interface Profile {
  id: string; // e.g. "SC-ELDER-8F42A1"
  role: UserRole;
  displayName: string;
  avatarUrl: string;
  faceVerificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ElderlyProfile {
  id: string;
  profileId: string;
  dateOfBirth?: string;
  preferredLanguage: SupportedLanguage;
  largeTextEnabled: boolean;
  highContrastEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  voiceBirdAlarmEnabled: boolean;
  customVoiceUrl?: string;
  customVoiceText?: string;
  createdAt: string;
  updatedAt: string;
}

export type FamilyRelationship =
  | 'son'
  | 'daughter'
  | 'grandson'
  | 'granddaughter'
  | 'relative'
  | 'caregiver'
  | 'other';

export interface CaregiverProfile {
  id: string;
  profileId: string;
  relationship: FamilyRelationship;
  relationshipTitle: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type FamilyLinkStatus = 'pending' | 'active' | 'revoked';

export interface FamilyLink {
  id: string;
  elderlyProfileId: string;
  caregiverProfileId: string;
  status: FamilyLinkStatus;
  inviteCode: string; // e.g. "SC-48291"
  createdAt: string;
  acceptedAt?: string;
}

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
  elderlyProfileId: string;
  name: string;
  dosage: string;
  unit: string;
  instructions: string;
  color: string;
  icon: string;
  photoPreset?: MedicationPhotoPreset;
  customPhotoUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  time: string; // "18:00"
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] (0=Sunday)
  enabled: boolean;
  gracePeriodSeconds: number; // e.g. 900 (15 min)
  createdAt: string;
  updatedAt: string;
}

export type MedicationIntakeStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export interface MedicationIntake {
  id: string;
  medicationId: string;
  scheduledFor: string; // ISO string or "YYYY-MM-DD HH:mm"
  timeStr: string; // "18:00"
  status: MedicationIntakeStatus;
  confirmedAt?: string;
  responseTimeSeconds?: number;
  createdAt: string;
}

export interface EmergencySettings {
  id: string;
  elderlyProfileId: string;
  enabled: boolean;
  responseTimeoutSeconds: number; // 45
  notifyCaregivers: boolean;
  demoMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmergencyEventType =
  | 'missed_medication'
  | 'manual_sos'
  | 'fall_detection'
  | 'inactivity';

export type EmergencyEventStatus =
  | 'pending'
  | 'countdown'
  | 'cancelled'
  | 'notified'
  | 'acknowledged'
  | 'resolved';

export interface EmergencyEvent {
  id: string;
  elderlyProfileId: string;
  type: EmergencyEventType;
  status: EmergencyEventStatus;
  triggeredAt: string;
  cancelledAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  metadata?: {
    medicationId?: string;
    medicationName?: string;
    countdownRemaining?: number;
    reason?: string;
    locationNote?: string;
  };
}

export interface PushSubscriptionRecord {
  id: string;
  profileId: string;
  deviceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface MemorySession {
  id: string;
  elderlyProfileId: string;
  category: 'picture' | 'attention' | 'logic' | 'classification' | 'route' | 'family' | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number; // 0..10
  durationSeconds: number;
  completedAt: string;
}

export interface MemoryResult {
  id: string;
  sessionId: string;
  exerciseType: string;
  correctAnswers: number;
  totalAnswers: number;
  score: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DailyPlan {
  id: string;
  elderlyProfileId: string;
  date: string; // "YYYY-MM-DD"
  memoryMinutes: number; // target 3
  attentionMinutes: number; // target 2
  logicMinutes: number; // target 2
  wordsMinutes: number; // target 2
  orientationMinutes: number; // target 1
  completed: boolean;
  createdAt: string;
}

export interface DailyTask {
  id: string;
  dailyPlanId: string;
  title: string;
  type: 'memory' | 'attention' | 'logic' | 'words' | 'orientation';
  completed: boolean;
  completedAt?: string;
}

export interface DayScheduleItem {
  id: string;
  elderlyProfileId: string;
  title: string;
  time: string; // "09:00", "11:00", "13:00", etc.
  description: string;
  category: 'medicine' | 'memory' | 'meal' | 'walk' | 'other';
  icon: string;
  completed: boolean;
  linkedMedicationId?: string;
}

export interface VoiceProfile {
  id: string;
  elderlyProfileId: string;
  name: string;
  audioUrl: string;
  type: 'family_voice' | 'assistant_voice';
  recordedBy?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  elderlyProfileId: string;
  date: string;
  mood: 'happy' | 'calm' | 'neutral' | 'tired' | 'sad';
  text: string;
  hasAudio: boolean;
  audioUrl?: string;
  createdAt: string;
}

export interface ActivityProgress {
  date: string;
  activeMinutes: number;
  targetMinutes: number;
  stepsEstimated: number;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
}
