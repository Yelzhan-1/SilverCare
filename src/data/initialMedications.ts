import { Medication, MemoryExerciseData } from '../types/medication';

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-amlodipine',
    name: 'Амлодипин',
    dosage: '1 таблетка (5 мг)',
    times: ['08:00', '14:00'],
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    photoPreset: 'pill-white',
    instructions: 'Для нормализации артериального давления. Запить водой.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-cardiomagnyl',
    name: 'Кардиомагнил',
    dosage: '1 таблетка сердечком (75 мг)',
    times: ['12:00'],
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    photoPreset: 'bottle-heart',
    instructions: 'Защита сердца и сосудов. Принимать после обеда.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-omeprazole',
    name: 'Омепразол',
    dosage: '1 капсула (20 мг)',
    times: ['14:00'],
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    photoPreset: 'capsule-blue',
    instructions: 'Для желудка. Принимать перед едой.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-vitamin-d',
    name: 'Витамин D3',
    dosage: '1 желтая капсула',
    times: ['18:00'],
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    photoPreset: 'tablet-yellow',
    instructions: 'Для костей и иммунитета. Во время еды.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-metformin',
    name: 'Метформин',
    dosage: '1 капсула (500 мг)',
    times: ['20:00'],
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    photoPreset: 'capsule-green',
    instructions: 'Вечерний приём для контроля сахара.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

export const MEMORY_EXERCISES: MemoryExerciseData[] = [
  {
    id: 'ex-1',
    studyItems: [
      { id: 'apple', emoji: '🍎', name: 'Яблоко' },
      { id: 'key', emoji: '🔑', name: 'Ключ' },
      { id: 'car', emoji: '🚗', name: 'Машина' },
    ],
    targetQuestion: 'Какой из этих предметов вы видели?',
    correctAnswerId: 'key',
    choices: [
      { id: 'umbrella', emoji: '☂️', name: 'Зонт' },
      { id: 'key', emoji: '🔑', name: 'Ключ' },
      { id: 'guitar', emoji: '🎸', name: 'Гитара' },
    ],
  },
  {
    id: 'ex-2',
    studyItems: [
      { id: 'cup', emoji: '☕', name: 'Чашка' },
      { id: 'glasses', emoji: '👓', name: 'Очки' },
      { id: 'book', emoji: '📚', name: 'Книга' },
    ],
    targetQuestion: 'Какой из этих предметов вы видели?',
    correctAnswerId: 'glasses',
    choices: [
      { id: 'glasses', emoji: '👓', name: 'Очки' },
      { id: 'bicycle', emoji: '🚲', name: 'Велосипед' },
      { id: 'lamp', emoji: '💡', name: 'Лампа' },
    ],
  },
  {
    id: 'ex-3',
    studyItems: [
      { id: 'flower', emoji: '🌸', name: 'Цветок' },
      { id: 'clock', emoji: '⏰', name: 'Часы' },
      { id: 'bread', emoji: '🍞', name: 'Хлеб' },
    ],
    targetQuestion: 'Какой из этих предметов вы видели?',
    correctAnswerId: 'flower',
    choices: [
      { id: 'hat', emoji: '🧢', name: 'Кепка' },
      { id: 'phone', emoji: '📱', name: 'Телефон' },
      { id: 'flower', emoji: '🌸', name: 'Цветок' },
    ],
  },
  {
    id: 'ex-4',
    studyItems: [
      { id: 'cat', emoji: '🐱', name: 'Кот' },
      { id: 'teapot', emoji: '🫖', name: 'Чайник' },
      { id: 'spoon', emoji: '🥄', name: 'Ложка' },
    ],
    targetQuestion: 'Какой из этих предметов вы видели?',
    correctAnswerId: 'spoon',
    choices: [
      { id: 'spoon', emoji: '🥄', name: 'Ложка' },
      { id: 'airplane', emoji: '✈️', name: 'Самолёт' },
      { id: 'scissors', emoji: '✂️', name: 'Ножницы' },
    ],
  },
];
