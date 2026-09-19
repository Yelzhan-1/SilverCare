import React from 'react';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import type { EscalationSnapshot } from '../../services/medication/escalationService';
import type { TodayScheduleItem } from '../../types/medication';

export interface MissedMedicationWarningProps {
  snapshot: EscalationSnapshot;
  onTaken: (item: TodayScheduleItem) => void;
  onSnooze: (item: TodayScheduleItem) => void;
}

function copyFor(snapshot: EscalationSnapshot): { title: string; body: string } {
  const name = snapshot.item?.name ?? 'лекарство';
  if (snapshot.phase === 'warning') {
    return {
      title: 'Вы ещё не подтвердили приём',
      body: `${name}: если не ответите, мы сообщим близким, что приём не подтверждён. Это не вызов скорой.`,
    };
  }
  const level = snapshot.severity ?? 'LOW';
  return {
    title: 'Близким отправлено уведомление',
    body: `Приём «${name}» не подтверждён (уровень ${level}). Скорая не вызывалась — только сообщение опекуну.`,
  };
}

export const MissedMedicationWarning: React.FC<MissedMedicationWarningProps> = ({
  snapshot,
  onTaken,
  onSnooze,
}) => {
  const visible =
    snapshot.item &&
    (snapshot.phase === 'warning' ||
      snapshot.phase === 'low' ||
      snapshot.phase === 'medium' ||
      snapshot.phase === 'high');
  if (!visible || !snapshot.item) return null;

  const { title, body } = copyFor(snapshot);

  return (
    <div
      id="missed-med-warning"
      className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-4 font-sans"
      role="alertdialog"
      aria-labelledby="missed-med-title"
      aria-describedby="missed-med-body"
    >
      <div className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-clay-md bg-clay-warning text-white flex items-center justify-center shrink-0 shadow-clay-raised-sm">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h2 id="missed-med-title" className="text-xl sm:text-2xl font-black text-clay-ink">
              {title}
            </h2>
            <p id="missed-med-body" className="text-base font-semibold text-clay-ink-soft mt-1 leading-relaxed">
              {body}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onTaken(snapshot.item!)}
            className="clay-tap min-h-16 px-4 bg-clay-success text-white font-black text-lg rounded-clay-md shadow-clay-success cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <Check className="w-6 h-6 inline mr-2" aria-hidden="true" />
            Я принял
          </button>
          <button
            type="button"
            onClick={() => onSnooze(snapshot.item!)}
            className="clay-tap min-h-16 px-4 bg-clay-surface-sunken text-clay-ink font-black text-lg rounded-clay-md shadow-clay-raised-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <Clock className="w-6 h-6 inline mr-2" aria-hidden="true" />
            Позже
          </button>
        </div>
      </div>
    </div>
  );
};
