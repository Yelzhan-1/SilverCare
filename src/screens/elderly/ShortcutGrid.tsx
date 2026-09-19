import React from 'react';
import { Pill, Siren, Brain, HeartPulse } from 'lucide-react';
import { audioAlarmService } from '../../services/audioAlarmService';

export interface ShortcutGridProps {
  onMeds: () => void;
  onSos: () => void;
  onGame: () => void;
  onWellbeing: () => void;
}

const TILE =
  'clay-tap min-h-28 sm:min-h-32 p-4 rounded-clay-lg shadow-clay-spotlight flex flex-col items-start justify-between text-left cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary';

export const ShortcutGrid: React.FC<ShortcutGridProps> = ({ onMeds, onSos, onGame, onWellbeing }) => {
  const tap = (fn: () => void, haptic = 30) => {
    audioAlarmService.triggerHaptic(haptic);
    fn();
  };

  return (
    <section aria-label="Быстрые действия" className="grid grid-cols-2 gap-3 sm:gap-4">
      <button type="button" onClick={() => tap(onMeds)} className={`${TILE} bg-clay-surface`}>
        <span className="w-14 h-14 rounded-clay-md bg-clay-success/15 text-clay-success flex items-center justify-center">
          <Pill className="w-8 h-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xl font-black text-clay-ink">Лекарства</span>
          <span className="block text-sm font-semibold text-clay-ink-soft">Приём и список</span>
        </span>
      </button>

      <button type="button" onClick={() => tap(onSos, 50)} className={`${TILE} bg-clay-danger/10`}>
        <span className="w-14 h-14 rounded-clay-md bg-clay-danger text-white flex items-center justify-center shadow-clay-danger">
          <Siren className="w-8 h-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xl font-black text-clay-danger">SOS</span>
          <span className="block text-sm font-bold text-clay-danger/80">Сигнал близким</span>
        </span>
      </button>

      <button type="button" onClick={() => tap(onGame)} className={`${TILE} bg-clay-surface`}>
        <span className="w-14 h-14 rounded-clay-md bg-clay-primary/10 text-clay-primary flex items-center justify-center">
          <Brain className="w-8 h-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xl font-black text-clay-ink">Игра</span>
          <span className="block text-sm font-semibold text-clay-ink-soft">Найди пары</span>
        </span>
      </button>

      <button type="button" onClick={() => tap(onWellbeing)} className={`${TILE} bg-clay-surface`}>
        <span className="w-14 h-14 rounded-clay-md bg-clay-wellbeing/15 text-clay-wellbeing flex items-center justify-center">
          <HeartPulse className="w-8 h-8" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xl font-black text-clay-ink">Состояние</span>
          <span className="block text-sm font-semibold text-clay-ink-soft">Датчики и день</span>
        </span>
      </button>
    </section>
  );
};
