import React from 'react';
import {
  Pill,
  Brain,
  Calendar,
  Heart,
  AlertTriangle,
  Mic,
  Smile,
  Layers,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  ChevronRight,
  Clock,
  LogIn,
} from 'lucide-react';
import { TodayScheduleItem, UserProfile } from '../types/medication';
import { getFormattedRussianDate } from '../services/storageService';
import { NextMedicationCard } from '../components/NextMedicationCard';
import { MedicationListItem } from '../components/MedicationListItem';
import { AdherenceGauge } from '../components/AdherenceGauge';
import { audioAlarmService } from '../services/audioAlarmService';

interface TodayScreenProps {
  scheduleItems: TodayScheduleItem[];
  nextItem: TodayScheduleItem | null;
  userProfile: UserProfile;
  onConfirmIntake: (item: TodayScheduleItem) => void;
  onOpenAlarm: (item: TodayScheduleItem) => void;
  onOpenSettings: () => void;
  onOpenFaceIdModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenFlashcards: () => void;
  onOpenMemorySuite: () => void;
  onOpenMyDay: () => void;
  onOpenFamily: () => void;
  onOpenEmergency: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenRoleSwitch: () => void;
  demoCountdown: number | null;
  onCancelDemoCountdown: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  scheduleItems,
  nextItem,
  userProfile,
  onConfirmIntake,
  onOpenAlarm,
  onOpenSettings,
  onOpenFaceIdModal,
  onOpenVoiceModal,
  onOpenFlashcards,
  onOpenMemorySuite,
  onOpenMyDay,
  onOpenFamily,
  onOpenEmergency,
  onOpenVoiceAssistant,
  onOpenRoleSwitch,
  demoCountdown,
  onCancelDemoCountdown,
}) => {
  const dateStr = getFormattedRussianDate();
  const takenCount = scheduleItems.filter((i) => i.status === 'taken').length;
  const totalCount = scheduleItems.length;

  return (
    <div className="flex-1 flex flex-col bg-[#F2F2F7] min-h-full pb-28 relative overflow-x-hidden font-sans">
      {/* Active Demo Countdown Banner */}
      {demoCountdown !== null && (
        <div className="sticky top-0 z-30 bg-[#FF3B30] text-white p-3 px-5 flex items-center justify-between shadow-md">
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

      {/* Senior Clean Header: SilverCare brand, Greeting & Discrete "Войти" */}
      <header className="px-5 sm:px-6 pt-4 pb-2 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💊</span>
              <span className="text-base font-black text-[#1C1C1E] tracking-tight">
                SilverCare
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] font-semibold mt-0.5">
              Добрый день, {userProfile.name}! ❤️
            </p>
          </div>

          {/* Right Top Buttons: "Войти / Роль" and Discrete Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRoleSwitch}
              className="h-9 px-3 rounded-full bg-white hover:bg-zinc-50 border border-black/[0.08] text-[#1C1C1E] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Переключить роль: Подопечный / Опекун"
            >
              <LogIn className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Войти</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-full bg-white hover:bg-zinc-50 border border-black/[0.08] text-[#1C1C1E] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              aria-label="Настройки"
            >
              <Settings className="w-4 h-4 text-[#8E8E93]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 sm:px-5 max-w-xl w-full mx-auto space-y-4 relative z-10">
        {/* SECTION 1: HERO NEXT MEDICATION CARD with Giant 110px button (Req #2, #4, #16, #50) */}
        <section aria-labelledby="heading-hero-medication">
          <NextMedicationCard
            item={nextItem}
            onConfirmIntake={onConfirmIntake}
            onTriggerAlarm={onOpenAlarm}
            onOpenVoiceSettings={onOpenVoiceModal}
          />
        </section>

        {/* SECTION 2: 5 GIANT SENIOR TILES (Req #3, #50, #80) */}
        <section aria-label="Основные разделы">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tile 1: 🧠 Память */}
            <button
              onClick={() => {
                audioAlarmService.triggerHaptic(30);
                onOpenMemorySuite();
              }}
              className="min-h-[76px] p-3.5 bg-white hover:bg-zinc-50 border border-black/[0.06] rounded-3xl shadow-xs flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0 text-2xl">
                🧠
              </div>
              <div>
                <h3 className="text-base font-black text-[#1C1C1E] leading-tight">
                  Память
                </h3>
                <p className="text-[11px] font-semibold text-[#8E8E93]">
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
              className="min-h-[76px] p-3.5 bg-white hover:bg-zinc-50 border border-black/[0.06] rounded-3xl shadow-xs flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0 text-2xl">
                📅
              </div>
              <div>
                <h3 className="text-base font-black text-[#1C1C1E] leading-tight">
                  Мой день
                </h3>
                <p className="text-[11px] font-semibold text-[#8E8E93]">
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
              className="min-h-[76px] p-3.5 bg-white hover:bg-zinc-50 border border-black/[0.06] rounded-3xl shadow-xs flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center shrink-0 text-2xl">
                ❤️
              </div>
              <div>
                <h3 className="text-base font-black text-[#1C1C1E] leading-tight">
                  Близкие
                </h3>
                <p className="text-[11px] font-semibold text-[#8E8E93]">
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
              className="min-h-[76px] p-3.5 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 border-2 border-[#FF3B30]/30 rounded-3xl shadow-xs flex items-center gap-3 text-left transition-all active:scale-98 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FF3B30] text-white flex items-center justify-center shrink-0 text-xl font-bold">
                🆘
              </div>
              <div>
                <h3 className="text-base font-black text-[#FF3B30] leading-tight">
                  Помощь
                </h3>
                <p className="text-[11px] font-bold text-[#FF3B30]/80">
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
            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-[#007AFF]/20 rounded-3xl flex items-center justify-between shadow-2xs cursor-pointer hover:shadow-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-xs">
                <Mic className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#1C1C1E]">
                  Спросить SilverCare голосом
                </h4>
                <p className="text-xs text-[#8E8E93]">
                  «Когда следующее лекарство?», «Что сделать сегодня?»
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#007AFF]">Спросить →</span>
          </div>
        </section>

        {/* SECTION 4: FLASHCARDS FOR MEMORY */}
        <section aria-labelledby="heading-flashcards-widget">
          <div
            onClick={onOpenFlashcards}
            className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-black/[0.06] cursor-pointer hover:shadow-md transition-all active:scale-98 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center text-xl">
                  🗂️
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C1C1E]">
                    Флэш-карты для памяти
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    3D карточки вопросов и ответов для ясности ума
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E]">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/[0.04]">
              <div className="flex gap-1 text-[11px] font-medium text-[#8E8E93]">
                <span className="bg-[#F2F2F7] px-2 py-0.5 rounded-md">💊 Лекарства</span>
                <span className="bg-[#F2F2F7] px-2 py-0.5 rounded-md">🧠 Память</span>
                <span className="bg-[#F2F2F7] px-2 py-0.5 rounded-md">🌿 Природа</span>
              </div>
              <span className="text-xs font-bold text-[#007AFF]">Открыть →</span>
            </div>
          </div>
        </section>

        {/* SECTION 5: TODAY'S FULL MEDICATION LIST */}
        <section aria-labelledby="heading-today-list" className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 id="heading-today-list" className="text-lg font-black text-[#1C1C1E]">
              Все приёмы на сегодня
            </h2>
            <span className="text-xs font-bold text-[#8E8E93] bg-white px-2.5 py-1 rounded-full border border-black/[0.04] shadow-2xs">
              {takenCount} из {totalCount} принято
            </span>
          </div>

          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <MedicationListItem
                key={item.id}
                item={item}
                onSelect={onOpenAlarm}
              />
            ))}
          </div>
        </section>

        {/* Medical disclaimer */}
        <footer className="pt-2 pb-4 text-center">
          <p className="text-[11px] text-[#8E8E93]">
            SilverCare Safety Prototype • Забота о здоровье, памяти и близких
          </p>
        </footer>
      </main>

      {/* Floating Bottom Nav Dock */}
      <nav
        id="floating-dock-nav"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/90 ios-blur rounded-[28px] px-2 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/[0.06] flex items-center justify-around max-w-[420px] w-[94%]"
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 py-1 px-1 rounded-2xl text-[#007AFF] font-bold text-xs flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Clock className="w-5 h-5 stroke-[2.4]" />
          <span className="text-[10px]">Сегодня</span>
        </button>

        <button
          onClick={onOpenMemorySuite}
          className="flex-1 py-1 px-1 rounded-2xl text-[#8E8E93] hover:text-[#007AFF] font-medium text-xs flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Brain className="w-5 h-5" />
          <span className="text-[10px]">Память</span>
        </button>

        <button
          onClick={onOpenFlashcards}
          className="flex-1 py-1 px-1 rounded-2xl text-[#8E8E93] hover:text-[#FF9500] font-medium text-xs flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">Карты</span>
        </button>

        <button
          onClick={onOpenMyDay}
          className="flex-1 py-1 px-1 rounded-2xl text-[#8E8E93] hover:text-[#FF9500] font-medium text-xs flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Мой день</span>
        </button>

        <button
          onClick={onOpenFamily}
          className="flex-1 py-1 px-1 rounded-2xl text-[#8E8E93] hover:text-[#FF2D55] font-medium text-xs flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px]">Близкие</span>
        </button>
      </nav>
    </div>
  );
};
