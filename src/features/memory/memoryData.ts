export interface MemoryItem {
  id: string;
  emoji: string;
  name: string;
}

export const PICTURE_MEMORY_ITEMS: MemoryItem[] = [
  { id: 'apple', emoji: '🍎', name: 'Яблоко' },
  { id: 'key', emoji: '🔑', name: 'Ключ' },
  { id: 'coffee', emoji: '☕', name: 'Чашка чая' },
  { id: 'book', emoji: '📖', name: 'Книга' },
  { id: 'flower', emoji: '🌸', name: 'Цветок' },
  { id: 'car', emoji: '🚗', name: 'Машина' },
  { id: 'clock', emoji: '⏰', name: 'Часы' },
  { id: 'glasses', emoji: '👓', name: 'Очки' },
];

export const PICTURE_DISTRACTORS: MemoryItem[] = [
  { id: 'bread', emoji: '🍞', name: 'Хлеб' },
  { id: 'umbrella', emoji: '☂️', name: 'Зонт' },
  { id: 'cat', emoji: '🐱', name: 'Кот' },
  { id: 'house', emoji: '🏡', name: 'Дом' },
];

export const WHAT_CHANGED_SCENES = [
  {
    title: 'Предметы на столе',
    original: ['☕', '📖', '🔑', '🍎', '🕯️'],
    changed: ['☕', '📖', '🕶️', '🍎', '🕯️'],
    correctItem: '🕶️ Очки',
    options: ['🕶️ Очки', '🔑 Ключ', '☕ Чашка', '🍎 Яблоко'],
  },
  {
    title: 'Утренняя полка',
    original: ['🌸', '⏰', '📖', '🍵'],
    changed: ['🌸', '📻', '📖', '🍵'],
    correctItem: '📻 Радио',
    options: ['📻 Радио', '⏰ Будильник', '🌸 Цветок', '🍵 Чай'],
  },
];

export const ATTENTION_SYMBOLS = [
  { id: '1', char: '○', isTarget: true },
  { id: '2', char: '△', isTarget: false },
  { id: '3', char: '□', isTarget: false },
  { id: '4', char: '★', isTarget: false },
  { id: '5', char: '○', isTarget: true },
  { id: '6', char: '△', isTarget: false },
  { id: '7', char: '○', isTarget: true },
  { id: '8', char: '□', isTarget: false },
  { id: '9', char: '★', isTarget: false },
  { id: '10', char: '○', isTarget: true },
  { id: '11', char: '△', isTarget: false },
  { id: '12', char: '○', isTarget: true },
];

export const INSTRUCTION_QUESTIONS = [
  {
    instruction: 'Если видите 🔴 — нажмите СЛЕВА. Если видите 🔵 — нажмите СПРАВА.',
    currentSignal: '🔴',
    correctSide: 'left',
    leftLabel: 'Красный (Слева)',
    rightLabel: 'Синий (Справа)',
  },
  {
    instruction: 'Если видите 🔵 — нажмите СПРАВА. Если видите 🔴 — нажмите СЛЕВА.',
    currentSignal: '🔵',
    correctSide: 'right',
    leftLabel: 'Красный (Слева)',
    rightLabel: 'Синий (Справа)',
  },
];

export const LOGIC_PUZZLES = [
  {
    sequence: '2 → 4 → 6 → 8 → ?',
    hint: 'Числа увеличиваются на 2',
    options: ['9', '10', '11', '12'],
    correctAnswer: '10',
  },
  {
    sequence: '🟦 → 🟩 → 🟦 → 🟩 → ?',
    hint: 'Цвета чередуются',
    options: ['🟦 Синий', '🟩 Зелёный', '🟥 Красный', '🟨 Жёлтый'],
    correctAnswer: '🟦 Синий',
  },
  {
    sequence: '10 → 20 → 30 → 40 → ?',
    hint: 'Счёт десятками',
    options: ['45', '50', '60', '100'],
    correctAnswer: '50',
  },
];

export const CLASSIFICATION_QUESTIONS = [
  {
    question: 'Что здесь лишнее?',
    items: ['🍎 Яблоко', '🍌 Банан', '🍊 Апельсин', '🥕 Морковь'],
    correctAnswer: '🥕 Морковь',
    explanation: 'Морковь — это овощ, а остальные — фрукты.',
  },
  {
    question: 'Что здесь лишнее?',
    items: ['🕊️ Голубь', '🦅 Орёл', '🐕 Собака', '🦉 Сова'],
    correctAnswer: '🐕 Собака',
    explanation: 'Собака — четвероногое животное, а остальные — птицы.',
  },
];

export const ROUTE_MEMORY_STEPS = [
  { step: 1, icon: '🏠', name: 'Дом' },
  { step: 2, icon: '🌳', name: 'Парк' },
  { step: 3, icon: '🏪', name: 'Аптека' },
  { step: 4, icon: '🚌', name: 'Остановка' },
  { step: 5, icon: '🏥', name: 'Поликлиника' },
];

export const FAMILY_PHOTOS = [
  {
    name: 'Алексей',
    relation: 'Сын',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    question: 'Кто изображён на этой фотографии?',
    options: ['Сын Алексей', 'Внук Дмитрий', 'Сосед Виктор', 'Доктор Михаил'],
    correctAnswer: 'Сын Алексей',
  },
];
