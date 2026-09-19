import React from 'react';
import { Award, RotateCcw } from 'lucide-react';

export interface PairGameEndScreenProps {
  pairsFound: number;
  pairsTotal: number;
  attempts: number;
  elapsedSec: number;
  score: number;
  onRestart: () => void;
  onClose: () => void;
}

export const PairGameEndScreen: React.FC<PairGameEndScreenProps> = ({
  pairsFound,
  pairsTotal,
  attempts,
  elapsedSec,
  score,
  onRestart,
  onClose,
}) => {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div className="w-20 h-20 rounded-full bg-clay-success text-white flex items-center justify-center shadow-clay-success">
        <Award className="w-10 h-10" aria-hidden="true" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-clay-ink">Отличная тренировка</h3>
      <p className="text-base font-semibold text-clay-ink-soft max-w-sm">
        Это упражнение для внимания, а не медицинский тест.
      </p>
      <dl className="grid grid-cols-2 gap-3 w-full max-w-sm text-clay-ink">
        <div className="bg-clay-surface-sunken rounded-clay-md p-3">
          <dt className="text-xs font-bold text-clay-ink-soft">Пары</dt>
          <dd className="text-xl font-black">
            {pairsFound}/{pairsTotal}
          </dd>
        </div>
        <div className="bg-clay-surface-sunken rounded-clay-md p-3">
          <dt className="text-xs font-bold text-clay-ink-soft">Попытки</dt>
          <dd className="text-xl font-black">{attempts}</dd>
        </div>
        <div className="bg-clay-surface-sunken rounded-clay-md p-3">
          <dt className="text-xs font-bold text-clay-ink-soft">Время</dt>
          <dd className="text-xl font-black">{elapsedSec} с</dd>
        </div>
        <div className="bg-clay-surface-sunken rounded-clay-md p-3">
          <dt className="text-xs font-bold text-clay-ink-soft">Оценка</dt>
          <dd className="text-xl font-black">{score} / 10</dd>
        </div>
      </dl>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={onRestart}
          className="clay-tap flex-1 min-h-16 bg-clay-primary text-white font-black text-lg rounded-clay-md shadow-clay-primary cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
        >
          <RotateCcw className="w-5 h-5 inline mr-2" aria-hidden="true" />
          Ещё раз
        </button>
        <button
          type="button"
          onClick={onClose}
          className="clay-tap flex-1 min-h-16 bg-clay-surface-sunken text-clay-ink font-black text-lg rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
        >
          На главную
        </button>
      </div>
    </div>
  );
};
