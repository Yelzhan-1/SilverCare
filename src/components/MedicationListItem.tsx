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
      className={`group w-full rounded-2xl p-4 sm:p-5 min-h-[82px] border transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
        isTaken
          ? 'bg-[#34C759]/5 border-[#34C759]/20 shadow-xs'
          : isMissed
          ? 'bg-[#FF3B30]/5 border-[#FF3B30]/20'
          : item.isNext
          ? 'bg-white border-[#007AFF] shadow-sm ring-2 ring-[#007AFF]/20'
          : 'bg-white border-black/[0.04] shadow-xs hover:border-black/[0.08]'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Лекарство ${item.name}, время ${item.time}, статус ${
        isTaken ? 'Принято' : isMissed ? 'Пропущено' : 'Ожидается'
      }`}
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
            <div className="w-10 h-10 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.8]" />
            </div>
          ) : isMissed ? (
            <div className="w-10 h-10 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center border border-[#FF3B30]/30">
              <AlertCircle className="w-6 h-6 stroke-[2.4]" />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                item.isNext
                  ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                  : 'border-[#C7C7CC] bg-transparent text-transparent'
              }`}
            >
              {item.isNext ? (
                <div className="w-3.5 h-3.5 rounded-full bg-[#007AFF]" />
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
                isTaken ? 'text-[#8E8E93] line-through' : 'text-[#1C1C1E]'
              }`}
            >
              {item.time}
            </span>

            <span
              className={`text-lg sm:text-xl font-extrabold font-sans break-words leading-tight ${
                isTaken ? 'text-[#8E8E93]' : 'text-[#1C1C1E]'
              }`}
            >
              {item.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm sm:text-base font-medium text-[#8E8E93]">
              {item.dosage}
            </span>

            {/* Status Badges */}
            {isTaken && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full">
                <span>✓</span>
                <span>Принято {item.confirmedAt ? `в ${item.confirmedAt}` : ''}</span>
              </span>
            )}

            {isMissed && (
              <span className="inline-flex items-center text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2.5 py-0.5 rounded-full">
                Пропущено
              </span>
            )}

            {isUpcoming && item.isNext && !snoozedUntilLabel && (
              <span className="inline-flex items-center text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                Следующий приём
              </span>
            )}

            {!isTaken && snoozedUntilLabel && (
              <span className="inline-flex items-center text-xs font-bold text-[#FF9500] bg-[#FF9500]/10 px-2.5 py-0.5 rounded-full">
                ⏰ Отложено до {snoozedUntilLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section: Visual pill + iOS chevron */}
      <div className="shrink-0 flex items-center gap-2">
        <MedicationVisual preset={item.photoPreset} customUrl={item.customPhotoUrl} size="sm" />
        <div className="text-[#C7C7CC] group-hover:text-[#1C1C1E] transition-colors">
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
