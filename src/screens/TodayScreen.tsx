import React, { useRef } from 'react';
import { Settings } from 'lucide-react';
import { TodayScheduleItem, UserProfile } from '../types/medication';
import { getFormattedRussianDate } from '../services/storageService';
import { NextMedicationCard } from '../components/NextMedicationCard';
import { MedicationListItem } from '../components/MedicationListItem';
import { StatusBanner, type StatusKind } from './elderly/StatusBanner';
import { ShortcutGrid } from './elderly/ShortcutGrid';
import { greetingForNow } from './elderly/greeting';

interface TodayScreenProps {
  scheduleItems: TodayScheduleItem[];
  nextItem: TodayScheduleItem | null;
  userProfile: UserProfile;
  snoozeInfo: Record<string, { label: string; ringAtIso: string }>;
  statusKind: StatusKind;
  onConfirmIntake: (item: TodayScheduleItem) => void;
  onOpenAlarm: (item: TodayScheduleItem) => void;
  onOpenEmergency: () => void;
  onOpenPairGame: () => void;
  onOpenWellbeing: () => void;
  onOpenMoreMenu: () => void;
  demoCountdown: number | null;
  onCancelDemoCountdown: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  scheduleItems,
  nextItem,
  userProfile,
  snoozeInfo,
  statusKind,
  onConfirmIntake,
  onOpenAlarm,
  onOpenEmergency,
  onOpenPairGame,
  onOpenWellbeing,
  onOpenMoreMenu,
  demoCountdown,
  onCancelDemoCountdown,
}) => {
  const listRef = useRef<HTMLElement>(null);
  const dateStr = getFormattedRussianDate();
  const takenCount = scheduleItems.filter((i) => i.status === 'taken').length;
  const totalCount = scheduleItems.length;

  return (
    <div className="flex-1 flex flex-col bg-clay-bg min-h-screen relative overflow-x-hidden font-sans">
      {demoCountdown !== null && (
        <div className="sticky top-0 z-30 bg-clay-danger text-white p-3 px-5 flex items-center justify-between">
          <span className="font-bold text-sm sm:text-base">
            Демо-таймер: {demoCountdown} сек
          </span>
          <button
            type="button"
            onClick={onCancelDemoCountdown}
            className="clay-tap min-h-11 px-3 text-sm font-bold bg-white/20 rounded-full cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Отмена
          </button>
        </div>
      )}

      <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-2 shrink-0">
        <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-lg sm:text-xl font-black text-clay-ink tracking-tight">SilverCare</span>
          <button
            id="btn-open-more-menu"
            type="button"
            onClick={onOpenMoreMenu}
            className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface text-clay-ink-soft flex items-center justify-center shadow-clay-raised-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            aria-label="Ещё: опекун, настройки и демо"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-2xl lg:max-w-3xl w-full mx-auto space-y-4 sm:space-y-5 pb-10">
        <StatusBanner
          kind={statusKind}
          greeting={greetingForNow(userProfile.name)}
          dateLabel={dateStr}
        />

        <ShortcutGrid
          onMeds={() => listRef.current?.scrollIntoView({ block: 'start' })}
          onSos={onOpenEmergency}
          onGame={onOpenPairGame}
          onWellbeing={onOpenWellbeing}
        />

        <section aria-labelledby="heading-hero-medication">
          <NextMedicationCard
            item={nextItem}
            onConfirmIntake={onConfirmIntake}
            onTriggerAlarm={onOpenAlarm}
            snoozedUntilLabel={nextItem ? snoozeInfo[nextItem.id]?.label : null}
            snoozedUntilIso={nextItem ? snoozeInfo[nextItem.id]?.ringAtIso : undefined}
          />
        </section>

        <section ref={listRef} aria-labelledby="heading-today-list" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <h2 id="heading-today-list" className="text-lg sm:text-xl font-black text-clay-ink">
              Все приёмы на сегодня
            </h2>
            <span className="text-sm font-bold text-clay-ink-soft bg-clay-surface px-2.5 py-1 rounded-full shadow-clay-raised-sm">
              {takenCount} из {totalCount} принято
            </span>
          </div>
          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <MedicationListItem
                key={item.id}
                item={item}
                onSelect={onOpenAlarm}
                snoozedUntilLabel={snoozeInfo[item.id]?.label}
              />
            ))}
          </div>
        </section>

        <footer className="pt-2 pb-4 text-center">
          <p className="text-sm text-clay-ink-soft">
            SilverCare не вызывает скорую и не ставит диагнозы. Это связь с близкими.
          </p>
        </footer>
      </main>
    </div>
  );
};
