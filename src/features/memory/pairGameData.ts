export type PairDifficulty = 'easy' | 'medium' | 'hard';

export interface PairCategory {
  id: string;
  label: string;
  symbols: string[];
}

export const PAIR_COUNTS: Record<PairDifficulty, number> = {
  easy: 3,
  medium: 6,
  hard: 8,
};

export const PAIR_CATEGORIES: PairCategory[] = [
  {
    id: 'garden',
    label: 'Сад',
    symbols: ['🌹', '🌻', '🌷', '🌼', '🌿', '🍎', '🍒', '🍋', '🍇', '🍉'],
  },
  {
    id: 'kitchen',
    label: 'Кухня',
    symbols: ['🍞', '🥛', '🫖', '🥣', '🍳', '🧀', '🥕', '🥔', '🐟', '🍯'],
  },
  {
    id: 'home',
    label: 'Дом',
    symbols: ['🏠', '🔑', '📷', '📚', '⏰', '🛋️', '🪟', '🕯️', '🧥', '👓'],
  },
  {
    id: 'family',
    label: 'Семья',
    symbols: ['👨', '👩', '👧', '👦', '👴', '👵', '🐕', '🐈', '❤️', '🏡'],
  },
];

export interface PairCard {
  id: string;
  pairId: string;
  symbol: string;
}

export function shufflePairs(category: PairCategory, difficulty: PairDifficulty): PairCard[] {
  const count = PAIR_COUNTS[difficulty];
  const chosen = category.symbols.slice(0, count);
  const doubled: PairCard[] = chosen.flatMap((symbol, index) => [
    { id: `${index}-a`, pairId: String(index), symbol },
    { id: `${index}-b`, pairId: String(index), symbol },
  ]);
  for (let i = doubled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled;
}

export function pairScore(pairsFound: number, pairsTotal: number, attempts: number): number {
  if (pairsTotal === 0) return 0;
  const extra = Math.max(0, attempts - pairsTotal);
  const base = Math.round((pairsFound / pairsTotal) * 10);
  return Math.max(0, Math.min(10, base - extra));
}
