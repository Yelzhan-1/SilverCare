import React from 'react';
import { Volume2, VolumeX, RotateCcw, X } from 'lucide-react';
import type { PairCategory, PairDifficulty } from './pairGameData';
import { PAIR_CATEGORIES, PAIR_COUNTS } from './pairGameData';

export interface PairGameHudProps {
  categoryId: string;
  difficulty: PairDifficulty;
  soundOn: boolean;
  pairsFound: number;
  pairsTotal: number;
  attempts: number;
  elapsedSec: number;
  onCategory: (id: string) => void;
  onDifficulty: (d: PairDifficulty) => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onClose: () => void;
}

const DIFFS: { id: PairDifficulty; label: string }[] = [
  { id: 'easy', label: 'Легко' },
  { id: 'medium', label: 'Средне' },
  { id: 'hard', label: 'Сложно' },
];

export const PairGameHud: React.FC<PairGameHudProps> = ({
  categoryId,
  difficulty,
  soundOn,
  pairsFound,
  pairsTotal,
  attempts,
  elapsedSec,
  onCategory,
  onDifficulty,
  onToggleSound,
  onRestart,
  onClose,
}) => {
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <header className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-clay-ink">Найди пары</h2>
          <p className="text-sm font-semibold text-clay-ink-soft">
            {pairsFound} из {pairsTotal} · попыток {attempts} · {mm}:{ss}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
            className="clay-tap min-h-11 min-w-11 rounded-clay-sm bg-clay-surface-sunken text-clay-ink flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onRestart}
            aria-label="Начать заново"
            className="clay-tap min-h-11 min-w-11 rounded-clay-sm bg-clay-surface-sunken text-clay-ink flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть игру"
            className="clay-tap min-h-11 min-w-11 rounded-clay-sm bg-clay-surface-sunken text-clay-ink flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PAIR_CATEGORIES.map((cat: PairCategory) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategory(cat.id)}
            className={`clay-tap min-h-11 px-3 rounded-clay-sm font-bold text-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
              cat.id === categoryId
                ? 'bg-clay-primary text-white shadow-clay-primary'
                : 'bg-clay-surface-sunken text-clay-ink'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DIFFS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDifficulty(d.id)}
            className={`clay-tap min-h-11 px-3 rounded-clay-sm font-bold text-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
              d.id === difficulty
                ? 'bg-clay-ink text-clay-surface shadow-clay-raised-sm'
                : 'bg-clay-surface-sunken text-clay-ink'
            }`}
          >
            {d.label} ({PAIR_COUNTS[d.id]})
          </button>
        ))}
      </div>
    </header>
  );
};
