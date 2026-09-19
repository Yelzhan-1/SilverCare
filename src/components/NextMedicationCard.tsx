import React, { useState, useEffect } from 'react';
import { Clock, Bell, Check, Pill, Bird, Sparkles, Volume2 } from 'lucide-react';
import { TodayScheduleItem } from '../types/medication';
import { MedicationVisual } from './MedicationVisual';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';

interface NextMedicationCardProps {
  item: TodayScheduleItem | null;
  onConfirmIntake: (item: TodayScheduleItem) => void;
  onTriggerAlarm: (item: TodayScheduleItem) => void;
  onOpenVoiceSettings?: () => void;
  /** "HH:MM" if this item was snoozed and will ring again automatically */
  snoozedUntilLabel?: string | null;
  /** Absolute ISO timestamp to count down to when snoozed (instead of the
   * now-past original scheduled time) */
  snoozedUntilIso?: string | null;
}

export const NextMedicationCard: React.FC<NextMedicationCardProps> = ({
  item,
  onConfirmIntake,
  onTriggerAlarm,
  onOpenVoiceSettings,
  snoozedUntilLabel,
  snoozedUntilIso,
}) => {
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [countdownStr, setCountdownStr] = useState('00:43');

  // Real countdown calculator — counts down to the snooze ring time when
  // snoozed, otherwise to the originally scheduled time.
  useEffect(() => {
    if (!item) return;

    const updateRemaining = () => {
      const now = new Date();
      let target: Date;
      if (snoozedUntilIso) {
        target = new Date(snoozedUntilIso);
      } else {
        const [h, m] = item.time.split(':').map(Number);
        target = new Date();
        target.setHours(h, m, 0, 0);
      }

      const diffSec = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (diffSec <= 0 && diffSec >= -1800) {
        setCountdownStr('ПОРА!');
      } else if (diffSec > 0 && diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setCountdownStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else if (diffSec > 0) {
        const hrs = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        setCountdownStr(`${hrs} ч ${mins} м`);
      } else {
        setCountdownStr('Пропущен');
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [item, snoozedUntilIso]);

  if (!item || justConfirmed) {
    return (
      <div
        id="next-medication-empty"
        className="w-full bg-clay-success/10 border-2 border-clay-success/25 rounded-clay-xl p-6 sm:p-8 text-center shadow-clay-raised-sm"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-clay-success text-white mb-3 shadow-clay-success">
          <Check className="w-10 h-10 stroke-[3.5]" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-clay-ink tracking-tight">
          Отлично! Приём подтверждён
        </h3>
        <p className="text-base text-clay-ink-soft mt-1.5 font-semibold">
          Все необходимые лекарства приняты вовремя. Будьте здоровы!
        </p>
      </div>
    );
  }

  const handleBigConfirm = () => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic([60, 40, 60]);
    setJustConfirmed(true);
    onConfirmIntake(item);

    setTimeout(() => {
      setJustConfirmed(false);
    }, 4000);
  };

  const handleSpeakMedication = () => {
    audioAlarmService.triggerHaptic(30);
    speechService.speak(`Пора принять лекарство ${item.name}, ${item.dosage}. ${item.instructions || ''}`);
  };

  return (
    <div
      id="next-medication-card"
      className="relative w-full bg-clay-surface rounded-clay-xl p-5 sm:p-7 shadow-clay-raised overflow-hidden transition-all"
    >
      {/* Top row: Status pill & Countdown */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {snoozedUntilLabel ? (
          <div className="inline-flex items-center gap-2 bg-clay-warning/15 text-clay-warning px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Отложено до {snoozedUntilLabel}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-clay-primary/10 text-clay-primary-ink px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Пора принять лекарство</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-clay-surface-sunken px-3 py-1 rounded-full text-xs font-bold text-clay-ink">
          <span className="text-clay-ink-soft" aria-hidden="true">⏱</span>
          <span className="font-mono text-sm text-clay-primary-ink font-black">{countdownStr}</span>
        </div>
      </div>

      {/* Medication Information */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-clay-ink tracking-tight">
              {item.time}
            </span>
            <button
              onClick={handleSpeakMedication}
              className="w-8 h-8 rounded-full bg-clay-primary/10 hover:bg-clay-primary/20 text-clay-primary flex items-center justify-center cursor-pointer transition-colors"
              title="Озвучить голосом"
              aria-label="Озвучить название и дозировку лекарства"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-clay-ink mt-1 tracking-tight break-words">
            {item.name}
          </h2>

          <div className="text-base sm:text-lg font-bold text-clay-primary-ink mt-0.5">
            {item.dosage}
          </div>

          {item.instructions && (
            <p className="text-xs sm:text-sm text-clay-ink-soft mt-1 font-medium leading-relaxed">
              {item.instructions}
            </p>
          )}
        </div>

        {/* Medication Visual */}
        <div className="shrink-0 p-3.5 rounded-clay-md bg-clay-surface-sunken flex items-center justify-center">
          <MedicationVisual
            preset={item.photoPreset}
            customUrl={item.customPhotoUrl}
            size="lg"
          />
        </div>
      </div>

      {/* Bird song reminder notification info */}
      <div className="mt-3 flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-clay-success/10 text-xs font-bold text-clay-ink">
        <div className="flex items-center gap-2">
          <Bird className="w-4 h-4 text-clay-success" />
          <span>Сигнал: пение птиц + голос сына Алексея</span>
        </div>
        <button
          onClick={() => onTriggerAlarm(item)}
          className="text-xs text-clay-primary-ink font-extrabold hover:underline cursor-pointer"
        >
          Будильник →
        </button>
      </div>

      {/* GIANT 1-CLICK CONFIRMATION BUTTON — the ONE clear primary action on
          this screen (min-height 110px ≈ generous hit-area for elderly users). */}
      <div className="mt-4 pt-2">
        <button
          id="btn-confirm-intake-hero"
          onClick={handleBigConfirm}
          className="clay-tap w-full min-h-[110px] bg-clay-success active:scale-98 text-white font-black text-2xl sm:text-3xl rounded-clay-lg flex flex-col items-center justify-center gap-1 shadow-clay-success transition-all cursor-pointer select-none"
          aria-label="Я принял лекарство"
        >
          <div className="flex items-center gap-3">
            <Check className="w-9 h-9 sm:w-11 sm:h-11 stroke-[3.5]" />
            <span>Я ПРИНЯЛ ЛЕКАРСТВО</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold opacity-90">
            Нажмите здесь, чтобы подтвердить приём в 1 касание
          </span>
        </button>
      </div>
    </div>
  );
};
