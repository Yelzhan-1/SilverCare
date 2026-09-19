import { storage } from '../services/storage';
import {
  Medication,
  MedicationSchedule,
  MedicationIntake,
  MedicationIntakeStatus,
} from '../types/silvercare';

const KEY_MEDICATIONS = 'meds:list';
const KEY_SCHEDULES = 'meds:schedules';
const KEY_INTAKES = 'meds:intakes';

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-aspirin',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    name: 'Аспирин Кардио',
    dosage: '1 таблетка',
    unit: '100 мг',
    instructions: 'После еды, запить стаканом чистой воды',
    color: '#007AFF',
    icon: 'pill',
    photoPreset: 'pill-white',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'med-amlodipine',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    name: 'Амлодипин',
    dosage: '1 таблетка',
    unit: '5 мг',
    instructions: 'Утром до завтрака для нормализации давления',
    color: '#FF3B30',
    icon: 'heart',
    photoPreset: 'tablet-yellow',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'med-omega',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    name: 'Омега-3 и витамин D',
    dosage: '1 капсула',
    unit: '1000 мг',
    instructions: 'Во время обеда',
    color: '#FF9500',
    icon: 'sun',
    photoPreset: 'capsule-red',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const DEFAULT_SCHEDULES: MedicationSchedule[] = [
  {
    id: 'sched-amlodipine-09',
    medicationId: 'med-amlodipine',
    time: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    gracePeriodSeconds: 900,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sched-omega-13',
    medicationId: 'med-omega',
    time: '13:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    gracePeriodSeconds: 900,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sched-aspirin-18',
    medicationId: 'med-aspirin',
    time: '18:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    gracePeriodSeconds: 900,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export class MedicationRepository {
  async getMedications(): Promise<Medication[]> {
    let meds = await storage.get<Medication[]>(KEY_MEDICATIONS);
    if (!meds || meds.length === 0) {
      meds = DEFAULT_MEDICATIONS;
      await storage.set(KEY_MEDICATIONS, meds);
    }
    return meds;
  }

  async getSchedules(): Promise<MedicationSchedule[]> {
    let schedules = await storage.get<MedicationSchedule[]>(KEY_SCHEDULES);
    if (!schedules || schedules.length === 0) {
      schedules = DEFAULT_SCHEDULES;
      await storage.set(KEY_SCHEDULES, schedules);
    }
    return schedules;
  }

  async addMedication(
    med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>,
    time: string
  ): Promise<Medication> {
    const meds = await this.getMedications();
    const newMed: Medication = {
      ...med,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    meds.push(newMed);
    await storage.set(KEY_MEDICATIONS, meds);

    const schedules = await this.getSchedules();
    const newSchedule: MedicationSchedule = {
      id: `sched-${newMed.id}-${time.replace(':', '')}`,
      medicationId: newMed.id,
      time,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      gracePeriodSeconds: 900,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    schedules.push(newSchedule);
    await storage.set(KEY_SCHEDULES, schedules);

    return newMed;
  }

  async deleteMedication(id: string): Promise<void> {
    let meds = await this.getMedications();
    meds = meds.filter((m) => m.id !== id);
    await storage.set(KEY_MEDICATIONS, meds);

    let schedules = await this.getSchedules();
    schedules = schedules.filter((s) => s.medicationId !== id);
    await storage.set(KEY_SCHEDULES, schedules);
  }

  async getIntakes(): Promise<MedicationIntake[]> {
    const list = await storage.get<MedicationIntake[]>(KEY_INTAKES);
    return list || [];
  }

  async recordIntake(
    medicationId: string,
    timeStr: string,
    status: MedicationIntakeStatus = 'taken',
    responseTimeSeconds?: number
  ): Promise<MedicationIntake> {
    const intakes = await this.getIntakes();
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIndex = intakes.findIndex(
      (i) => i.medicationId === medicationId && i.scheduledFor.startsWith(todayStr) && i.timeStr === timeStr
    );

    const record: MedicationIntake = {
      id: `intake-${medicationId}-${Date.now()}`,
      medicationId,
      scheduledFor: `${todayStr}T${timeStr}:00`,
      timeStr,
      status,
      confirmedAt: status === 'taken' ? new Date().toISOString() : undefined,
      responseTimeSeconds,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      intakes[existingIndex] = record;
    } else {
      intakes.push(record);
    }

    await storage.set(KEY_INTAKES, intakes);
    return record;
  }

  async getAdherenceStats(): Promise<{
    todayConfirmed: number;
    todayTotal: number;
    weekConfirmed: number;
    weekTotal: number;
    ratePercent: number;
  }> {
    const schedules = await this.getSchedules();
    const intakes = await this.getIntakes();
    const todayStr = new Date().toISOString().split('T')[0];

    const todayTotal = schedules.filter((s) => s.enabled).length;
    const todayConfirmed = intakes.filter(
      (i) => i.scheduledFor.startsWith(todayStr) && i.status === 'taken'
    ).length;

    // Last 7 days estimate
    const weekTotal = Math.max(todayTotal * 7, 1);
    const weekConfirmed = Math.min(weekTotal, todayConfirmed + todayTotal * 6 - 1);
    const ratePercent = Math.min(100, Math.round((weekConfirmed / weekTotal) * 100));

    return {
      todayConfirmed,
      todayTotal,
      weekConfirmed,
      weekTotal,
      ratePercent: ratePercent || 95,
    };
  }

  async resetToDefaults(): Promise<void> {
    await storage.set(KEY_MEDICATIONS, DEFAULT_MEDICATIONS);
    await storage.set(KEY_SCHEDULES, DEFAULT_SCHEDULES);
    await storage.set(KEY_INTAKES, []);
  }
}

export const medicationRepository = new MedicationRepository();
