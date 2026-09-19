import { storage } from '../services/storage';
import { DayScheduleItem } from '../types/silvercare';

const KEY_SCHEDULE = 'day:schedule';

const DEFAULT_DAY_SCHEDULE: DayScheduleItem[] = [
  {
    id: 'day-0900-med',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '09:00',
    title: 'Утреннее лекарство',
    description: 'Амлодипин (1 таблетка) до завтрака',
    category: 'medicine',
    icon: 'pill',
    completed: true,
    linkedMedicationId: 'med-amlodipine',
  },
  {
    id: 'day-1100-mem',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '11:00',
    title: 'Тренировка памяти',
    description: '10 минут полезных упражнений для бодрости ума',
    category: 'memory',
    icon: 'brain',
    completed: true,
  },
  {
    id: 'day-1300-lunch',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '13:00',
    title: 'Обед и витамины',
    description: 'Омега-3 и теплый полезный обед',
    category: 'meal',
    icon: 'utensils',
    completed: true,
    linkedMedicationId: 'med-omega',
  },
  {
    id: 'day-1600-walk',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '16:00',
    title: 'Прогулка на свежем воздухе',
    description: '30 минут приятной ходьбы в парке или во дворе',
    category: 'walk',
    icon: 'footprints',
    completed: false,
  },
  {
    id: 'day-1800-med',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '18:00',
    title: 'Вечернее лекарство',
    description: 'Аспирин Кардио (1 таблетка) после ужина',
    category: 'medicine',
    icon: 'pill',
    completed: false,
    linkedMedicationId: 'med-aspirin',
  },
  {
    id: 'day-2100-rest',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    time: '21:00',
    title: 'Спокойный вечер и отдых',
    description: 'Запись впечатлений дня в Дневник и подготовка ко сну',
    category: 'other',
    icon: 'moon',
    completed: false,
  },
];

export class ScheduleRepository {
  async getSchedule(): Promise<DayScheduleItem[]> {
    const list = await storage.get<DayScheduleItem[]>(KEY_SCHEDULE);
    if (!list || list.length === 0) {
      await storage.set(KEY_SCHEDULE, DEFAULT_DAY_SCHEDULE);
      return DEFAULT_DAY_SCHEDULE;
    }
    return list;
  }

  async toggleCompletion(id: string): Promise<DayScheduleItem[]> {
    const list = await this.getSchedule();
    const target = list.find((item) => item.id === id);
    if (target) {
      target.completed = !target.completed;
      await storage.set(KEY_SCHEDULE, list);
    }
    return list;
  }

  async setCompletedByMedication(medicationId: string, completed: boolean): Promise<void> {
    const list = await this.getSchedule();
    let changed = false;
    list.forEach((item) => {
      if (item.linkedMedicationId === medicationId) {
        item.completed = completed;
        changed = true;
      }
    });
    if (changed) {
      await storage.set(KEY_SCHEDULE, list);
    }
  }

  async resetDefaults(): Promise<void> {
    await storage.set(KEY_SCHEDULE, DEFAULT_DAY_SCHEDULE);
  }
}

export const scheduleRepository = new ScheduleRepository();
