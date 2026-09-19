import React from 'react';
import {
  Mic,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { TodayScheduleItem, UserProfile } from '../types/medication';
import { getFormattedRussianDate } from '../services/storageService';
import { NextMedicationCard } from '../components/NextMedicationCard';
import { MedicationListItem } from '../components/MedicationListItem';
import { audioAlarmService } from '../services/audioAlarmService';

interface TodayScreenProps {
  scheduleItems: TodayScheduleItem[];
  nextItem: TodayScheduleItem | null;
  userProfile: UserProfile;
  /** scheduleItem.id -> snooze label + absolute ring ISO, so cards can show
   * "Отложено до ..." and count down to the real ring time. */
  snoozeInfo: Record<string, { label: string; ringAtIso: string }>;
  onConfirmIntake: (item: TodayScheduleItem) => void;
  onOpenAlarm: (item: TodayScheduleItem) => void;
  onOpenFaceIdModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenFlashcards: () => void;
  onOpenMemorySuite: () => void;
  onOpenMyDay: () => void;
  onOpenFamily: () => void;
  onOpenEmergency: () => void;
  onOpenVoiceAssistant: () => void;
  /** Single discreet entry point: role switch, caregiver settings, jury demo tools */
  onOpenMoreMenu: () => void;
  demoCountdown: number | null;
  onCancelDemoCountdown: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  scheduleItems,
  nextItem,
  userProfile,
  snoozeInfo,
  onConfirmIntake,
  onOpenAlarm,
  onOpenVoiceModal,
  onOpenFlashcards,
  onOpenMemorySuite,
  onOpenMyDay,
  onOpenFamily,
  onOpenEmergency,
  onOpenVoiceAssistant,
  onOpenMoreMenu,
  demoCountdown,
  onCancelDemoCountdown,
}) => {
  const dateStr = getFormattedRussianDate();
  const takenCount = scheduleItems.filter((i) => i.status === 'taken').length;
  const totalCount = scheduleItems.length;

  return (
    <div className="flex-1 flex flex-col bg-clay-bg min-h-screen relative overflow-x-hidden font-sans">
      {/* Active Demo Countdown Banner */}
      {demoCountdown !== null && (
        <div className="sticky top-0 z-30 bg-clay-danger text-white p-3 px-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Демо-таймер проверки безопасности: </span>
            <span className="font-black bg-black/30 px-2 py-0.5 rounded-md font-mono">
              {demoCountdown} сек
            </span>
          </div>
          <button
            onClick={onCancelDemoCountdown}
            className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full cursor-pointer"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Clean website-style header: brand + greeting + ONE discreet "more" entry
          (caregiver / settings / jury demo tools live behind this single icon,
          never a bottom tab bar). */}
      <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-2 shrink-0 relative z-10">
        <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💊</span>
              <span className="text-base sm:text-lg font-black text-clay-ink tracking-tight">
                SilverCare
              </span>
              <span className="hidden sm:inline text-xs text-clay-ink-soft font-medium">
                • {dateStr}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-clay-ink-soft font-semibold mt-0.5">
              Добрый день, {userProfile.name}! ❤️
            </p>
          </div>

          {/* Single discreet entry point — intentionally low-contrast, icon-only */}
          <button
            id="btn-open-more-menu"
            onClick={onOpenMoreMenu}
            className="clay-tap w-9 h-9 rounded-full bg-clay-surface hover:brightness-95 text-clay-ink-soft hover:text-clay-ink flex items-center justify-center shadow-clay-raised-sm transition-all cursor-pointer"
            aria-label="Ещё: опекун, настройки и демо для жюри"
            title="Ещё"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container: comfortably wide on desktop, touch-first on mobile */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-2xl lg:max-w-3xl w-full mx-auto space-y-4 sm:space-y-5 relative z-10 pb-10">
        {/* SECTION 1: HERO — the ONE clear primary action on this screen */}
        <section aria-labelledby="heading-hero-medication">
          <NextMedicationCard
            item={nextItem}
            onConfirmIntake={onConfirmIntake}
            onTriggerAlarm={onOpenAlarm}
            onOpenVoiceSettings={onOpenVoiceModal}
            snoozedUntilLabel={nextItem ? snoozeInfo[nextItem.id]?.label : null}
            snoozedUntilIso={nextItem ? snoozeInfo[nextItem.id]?.ringAtIso : undefined}
          />
        </section>

        {/* SECTION 2: Secondary actions as plain cards/tiles — NOT tabs.
            (Case explicitly forbids a bottom tab bar for the elderly UI.) */}
        <section aria-label="Основные разделы">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Tile 1: 🧠 Память */}
            <button
              onClick={() => {
                audioAlarmService.triggerHaptic(30);
                onOpenMemorySuite();
              }}
              className="clay-tap min-h-[76px] p-3.5 bg-clay-surface hover:brightness-[0.98] rounded-clay-md shadow-clay-raised-sm flex items-center gap-3 text-left transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-clay-primary/10 text-clay-primary flex items-center justify-center shrink-0 text-2xl">
                🧠
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-clay-ink leading-tight">
                  Память
                </h3>
                <p className="text-xs font-semibold text-clay-ink-soft">
                  10 мин разминка
                </p>
              </div>
            </button>

            {/* Tile 2: 📅 Мой день */}
            <button
              onClick={() => {
                audioAlarmService.triggerHaptic(30);
                onOpenMyDay();
              }}
              className="clay-tap min-h-[76px] p-3.5 bg-clay-surface hover:brightness-[0.98] rounded-clay-md shadow-clay-raised-sm flex items-center gap-3 text-left transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-clay-warning/12 text-clay-warning flex items-center justify-center shrink-0 text-2xl">
                📅
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-clay-ink leading-tight">
                  Мой день
                </h3>
                <p className="text-xs font-semibold text-clay-ink-soft">
                  Расписание дел
                </p>
              </div>
            </button>

            {/* Tile 3: ❤️ Близкие */}
            <button
              onClick={() => {
                audioAlarmService.triggerHaptic(30);
                onOpenFamily();
              }}
              className="clay-tap min-h-[76px] p-3.5 bg-clay-surface hover:brightness-[0.98] rounded-clay-md shadow-clay-raised-sm flex items-center gap-3 text-left transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center shrink-0 text-2xl">
                ❤️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-clay-ink leading-tight">
                  Близкие
                </h3>
                <p className="text-xs font-semibold text-clay-ink-soft">
                  Сын Алексей
                </p>
              </div>
            </button>

            {/* Tile 4: 🆘 Помощь */}
            <button
              onClick={() => {
                audioAlarmService.triggerHaptic(50);
                onOpenEmergency();
              }}
              className="clay-tap min-h-[76px] p-3.5 bg-clay-danger/10 hover:bg-clay-danger/15 rounded-clay-md shadow-clay-raised-sm flex items-center gap-3 text-left transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-clay-danger text-white flex items-center justify-center shrink-0 text-xl font-bold">
                🆘
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-clay-danger leading-tight">
                  Помощь
                </h3>
                <p className="text-xs font-bold text-clay-danger/80">
                  Сигнал близким
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* SECTION 3: VOICE ASSISTANT CALLOUT */}
        <section aria-label="Голосовой помощник">
          <div
            onClick={onOpenVoiceAssistant}
            className="clay-tap p-4 bg-clay-primary/8 rounded-clay-md flex items-center justify-between shadow-clay-raised-sm cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-clay-primary text-white flex items-center justify-center shadow-clay-primary shrink-0">
                <Mic className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-clay-ink">
                  Спросить SilverCare голосом
                </h4>
                <p className="text-xs text-clay-ink-soft truncate">
                  «Когда следующее лекарство?», «Что сделать сегодня?»
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-clay-primary-ink shrink-0 ml-2">Спросить →</span>
          </div>
        </section>

        {/* SECTION 4: FLASHCARDS FOR MEMORY */}
        <section aria-labelledby="heading-flashcards-widget">
          <div
            onClick={onOpenFlashcards}
            className="clay-tap bg-clay-surface rounded-clay-lg p-4 sm:p-5 shadow-clay-raised-sm cursor-pointer transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-clay-warning/12 text-clay-warning flex items-center justify-center text-xl shrink-0">
                  🗂️
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-clay-ink">
                    Флэш-карты для памяти
                  </h3>
                  <p className="text-xs text-clay-ink-soft">
                    3D карточки вопросов и ответов для ясности ума
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-clay-surface-sunken flex items-center justify-center text-clay-ink shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] flex-wrap gap-y-1.5">
              <div className="flex gap-1 text-xs font-medium text-clay-ink-soft flex-wrap">
                <span className="bg-clay-surface-sunken px-2 py-0.5 rounded-md">💊 Лекарства</span>
                <span className="bg-clay-surface-sunken px-2 py-0.5 rounded-md">🧠 Память</span>
                <span className="bg-clay-surface-sunken px-2 py-0.5 rounded-md">🌿 Природа</span>
              </div>
              <span className="text-xs font-bold text-clay-primary-ink">Открыть →</span>
            </div>
          </div>
        </section>

        {/* SECTION 5: TODAY'S FULL MEDICATION LIST */}
        <section aria-labelledby="heading-today-list" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 id="heading-today-list" className="text-lg font-black text-clay-ink">
              Все приёмы на сегодня
            </h2>
            <span className="text-xs font-bold text-clay-ink-soft bg-clay-surface px-2.5 py-1 rounded-full shadow-clay-raised-sm">
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

        {/* Medical disclaimer */}
        <footer className="pt-2 pb-4 text-center">
          <p className="text-xs text-clay-ink-soft">
            SilverCare Safety Prototype • Забота о здоровье, памяти и близких
          </p>
        </footer>
      </main>
    </div>
  );
};
