import React from 'react';
import { CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react';
import { TodayScheduleItem } from '../types/medication';
import { MedicationVisual } from './MedicationVisual';

interface MedicationListItemProps {
  item: TodayScheduleItem;
  onSelect: (item: TodayScheduleItem) => void;
  /** "HH:MM" if this item was snoozed and will ring again automatically */
  snoozedUntilLabel?: string | null;
}

export const MedicationListItem: React.FC<MedicationListItemProps> = ({
  item,
  onSelect,
  snoozedUntilLabel,
}) => {
  const isTaken = item.status === 'taken';
  const isMissed = item.status === 'missed';
  const isUpcoming = item.status === 'upcoming';

  return (
    <div
      id={`medication-item-${item.id}`}
      onClick={() => onSelect(item)}
      className={`clay-tap group w-full rounded-clay-md p-4 sm:p-5 min-h-[82px] transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
        isTaken
          ? 'bg-clay-success/8 shadow-clay-raised-sm'
          : isMissed
          ? 'bg-clay-danger/8 shadow-clay-raised-sm'
          : item.isNext
          ? 'bg-clay-surface shadow-clay-primary ring-2 ring-clay-primary/25'
          : 'bg-clay-surface shadow-clay-raised-sm hover:brightness-[0.98]'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Лекарство ${item.name}, время ${item.time}, статус ${
        isTaken ? 'Принято' : isMissed ? 'Пропущено' : 'Ожидается'
      }${snoozedUntilLabel && !isTaken ? `, отложено до ${snoozedUntilLabel}` : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
    >
      {/* Left section: Status Icon + Time + Names */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Status Indicator Icon */}
        <div className="shrink-0 flex items-center justify-center">
          {isTaken ? (
            <div className="w-10 h-10 rounded-full bg-clay-success text-white flex items-center justify-center shadow-clay-raised-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2.8]" />
            </div>
          ) : isMissed ? (
            <div className="w-10 h-10 rounded-full bg-clay-danger/10 text-clay-danger flex items-center justify-center border-2 border-clay-danger/30">
              <AlertCircle className="w-6 h-6 stroke-[2.4]" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                item.isNext
                  ? 'border-clay-primary bg-clay-primary/10 text-clay-primary'
                  : 'border-clay-ink-soft/30 bg-transparent text-transparent'
              }`}
            >
              {item.isNext ? (
                <div className="w-3.5 h-3.5 rounded-full bg-clay-primary" />
              ) : (
                <Circle className="w-5 h-5 stroke-[2]" />
              )}
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={`text-xl sm:text-2xl font-black font-sans tracking-tight shrink-0 ${
                isTaken ? 'text-clay-ink-soft line-through' : 'text-clay-ink'
              }`}
            >
              {item.time}
            </span>

            <span
              className={`text-lg sm:text-xl font-extrabold font-sans break-words leading-tight ${
                isTaken ? 'text-clay-ink-soft' : 'text-clay-ink'
              }`}
            >
              {item.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm sm:text-base font-medium text-clay-ink-soft">
              {item.dosage}
            </span>

            {/* Status Badges */}
            {isTaken && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-clay-success bg-clay-success/10 px-2.5 py-0.5 rounded-full">
                <span>✓</span>
                <span>Принято {item.confirmedAt ? `в ${item.confirmedAt}` : ''}</span>
              </span>
            )}

            {isMissed && (
              <span className="inline-flex items-center text-xs font-semibold text-clay-danger bg-clay-danger/10 px-2.5 py-0.5 rounded-full">
                Пропущено
              </span>
            )}

            {isUpcoming && item.isNext && !snoozedUntilLabel && (
              <span className="inline-flex items-center text-xs font-bold text-clay-primary-ink bg-clay-primary/10 px-2.5 py-0.5 rounded-full">
                Следующий приём
              </span>
            )}

            {!isTaken && snoozedUntilLabel && (
              <span className="inline-flex items-center text-xs font-bold text-clay-warning bg-clay-warning/10 px-2.5 py-0.5 rounded-full">
                ⏰ Отложено до {snoozedUntilLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section: Visual pill + chevron */}
      <div className="shrink-0 flex items-center gap-2">
        <MedicationVisual preset={item.photoPreset} customUrl={item.customPhotoUrl} size="sm" />
        <div className="text-clay-ink-soft group-hover:text-clay-ink transition-colors">
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
