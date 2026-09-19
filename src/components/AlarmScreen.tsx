import React, { useEffect, useState, useRef } from 'react';
import { Volume2, Check, AlertCircle, Bird, Bell, Mic } from 'lucide-react';
import { TodayScheduleItem } from '../types/medication';
import { MedicationVisual } from './MedicationVisual';
import { speechService } from '../services/speechService';
import { audioAlarmService } from '../services/audioAlarmService';
import { storageService } from '../services/storageService';

interface AlarmScreenProps {
  item: TodayScheduleItem;
  userName?: string;
  userAvatarUrl?: string;
  onConfirmTaken: (item: TodayScheduleItem) => void;
  /** Real snooze: caller re-triggers this same item ~5 minutes later. */
  onSnooze: (item: TodayScheduleItem) => void;
}

export const AlarmScreen: React.FC<AlarmScreenProps> = ({
  item,
  userName = 'Анна Ивановна',
  userAvatarUrl,
  onConfirmTaken,
  onSnooze,
}) => {
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasAnnouncedRef = useRef(false);

  const profile = storageService.getUserProfile();
  const soundType = profile.alarmSoundType || 'birds';
  const customAudioUrl = item.customAudioUrl || profile.customVoiceAudioUrl;
  const customVoiceText = item.customVoiceText || profile.customVoiceText;

  // Trigger sound alarm & voice announcement when alert mounts
  useEffect(() => {
    // 1. Start pleasant birdsong or chime audio loop
    audioAlarmService.startAlarmLoop(soundType);

    // 2. Play custom voice recording or Russian speech announcement
    const timer = setTimeout(() => {
      if (!hasAnnouncedRef.current) {
        hasAnnouncedRef.current = true;
        playVoiceMessage();
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      audioAlarmService.stopAlarmLoop();
      speechService.stop();
    };
  }, [soundType, customAudioUrl, customVoiceText, item.name, item.dosage, userName]);

  const playVoiceMessage = () => {
    setIsSpeaking(true);

    if (customAudioUrl) {
      // Play user's recorded audio voice
      audioAlarmService.playCustomAudio(customAudioUrl).then(() => {
        setIsSpeaking(false);
      });
    } else {
      // Speak custom or default text via TTS
      const textToSpeak = customVoiceText
        ? `${customVoiceText}. ${item.name}, ${item.dosage}.`
        : `${userName ? `${userName}, время` : 'Время'} принять лекарство. ${item.name}. ${item.dosage}.`;

      speechService.speak(textToSpeak).then(() => {
        setIsSpeaking(false);
      });
    }
  };

  // Re-listen / speak again button handler
  const handleReplayVoice = () => {
    audioAlarmService.triggerHaptic(60);
    playVoiceMessage();
  };

  // HONEST SNOOZE: stop sound now, caller re-triggers this alarm in ~5 minutes
  const handleSnoozeClick = () => {
    audioAlarmService.stopAlarmLoop();
    speechService.stop();
    audioAlarmService.triggerHaptic(30);
    onSnooze(item);
  };

  // ONE-CLICK CONFIRMATION
  const handleOneClickConfirm = () => {
    // Stop sound and voice immediately
    audioAlarmService.stopAlarmLoop();
    speechService.stop();

    // Play pleasant success chord
    audioAlarmService.playSuccessChime();

    // Enter visual celebration state
    setIsSuccessState(true);

    // Wait ~1.2s to show clear visual satisfaction, then trigger flow (save & memory game)
    setTimeout(() => {
      onConfirmTaken(item);
    }, 1200);
  };

  // SUCCESS ANIMATION OVERLAY
  if (isSuccessState) {
    return (
      <div
        id="alarm-success-screen"
        className="fixed inset-0 z-50 bg-clay-success text-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300 font-sans"
      >
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Pulsing checkmark icon */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white text-clay-success flex items-center justify-center shadow-xl mb-6 animate-bounce">
            <Check className="w-16 h-16 sm:w-20 sm:h-20 stroke-[3.5]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 font-sans">
            Лекарство принято
          </h2>

          <p className="text-xl sm:text-2xl text-white/90 font-bold mb-1">
            {item.name}
          </p>

          <p className="text-base text-white/80 font-medium">
            {item.dosage} • Записано в график здоровья
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="medication-alarm-modal"
      className="fixed inset-0 z-50 bg-black/80 ios-blur flex flex-col select-none font-sans"
      style={{ height: '100dvh' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-heading"
    >
      {/* Top Banner Alert Bar in iOS Dynamic Island style (fixed, never scrolls away) */}
      <div className="w-full max-w-md mx-auto pt-3 sm:pt-4 px-4 sm:px-6 shrink-0">
        <div className="bg-white/10 backdrop-blur-xl text-white py-2.5 px-5 rounded-full flex items-center justify-between border border-white/15 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
            <span
              id="alarm-heading"
              className="text-xs sm:text-sm font-semibold tracking-wide"
            >
              ВРЕМЯ ПРИНЯТЬ ЛЕКАРСТВО
            </span>
          </div>

          {/* Sound Type Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium text-white/90">
            {soundType === 'birds' ? (
              <>
                <Bird className="w-3.5 h-3.5 text-[#34C759]" />
                <span>Пение птиц</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>Звуковой сигнал</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable middle zone: only THIS area scrolls if content is tall.
          The confirm button below stays pinned and always visible without scrolling. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3">
      <div className="w-full max-w-md mx-auto bg-clay-surface rounded-clay-xl p-6 sm:p-7 shadow-clay-raised text-center flex flex-col items-center">
        {/* User identification badge */}
        {userName && (
          <div className="inline-flex items-center gap-2 bg-clay-surface-sunken px-3 py-1 rounded-full mb-3">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : null}
            <span className="text-xs font-semibold text-clay-ink-soft">
              Для: {userName}
            </span>
          </div>
        )}

        {/* Scheduled Time Display */}
        <div className="text-4xl sm:text-5xl font-black text-clay-ink tracking-tight mb-2 font-sans">
          {item.time}
        </div>

        {/* Medicine Visual */}
        <div className="my-2 p-3 bg-clay-surface-sunken rounded-3xl">
          <MedicationVisual
            preset={item.photoPreset}
            customUrl={item.customPhotoUrl}
            size="xl"
          />
        </div>

        {/* Medication Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-clay-ink tracking-tight mt-3 mb-1 break-words font-sans">
          {item.name}
        </h1>

        {/* Dosage */}
        <div className="text-base sm:text-lg font-semibold text-clay-primary-ink bg-clay-primary/10 px-4 py-1 rounded-full mt-1">
          {item.dosage}
        </div>

        {/* Specific instruction if available */}
        {item.instructions && (
          <p className="text-sm font-normal text-clay-ink-soft mt-3 max-w-sm">
            {item.instructions}
          </p>
        )}

        {/* Voice Announcement Badge */}
        {customAudioUrl ? (
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[#FF2D55]/10 text-[#FF2D55] font-semibold text-xs">
            <Mic className="w-3.5 h-3.5" />
            <span>Звучит живой голос близких</span>
          </div>
        ) : null}

        {/* Secondary Button: Re-speak Voice Announcement */}
        <button
          id="btn-replay-voice"
          onClick={handleReplayVoice}
          className={`clay-tap mt-5 w-full h-12 bg-clay-surface-sunken hover:brightness-95 text-clay-ink text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isSpeaking ? 'ring-2 ring-clay-primary bg-clay-primary/10 text-clay-primary-ink' : ''
          }`}
          aria-label="Прослушать голосовое напоминание ещё раз"
        >
          <Volume2 className={`w-5 h-5 text-clay-primary ${isSpeaking ? 'animate-pulse' : ''}`} />
          <span>{isSpeaking ? 'Голос звучит...' : 'Прослушать голос ещё раз'}</span>
        </button>
      </div>
      </div>

      {/* Bottom Area: Primary Confirm Button — pinned outside the scroll area,
          so it is ALWAYS visible without scrolling, even on short viewports. */}
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex flex-col gap-2 shrink-0">
        <button
          id="btn-confirm-taken"
          onClick={handleOneClickConfirm}
          className="clay-tap w-full h-18 min-h-[72px] bg-clay-success active:scale-[0.98] text-white text-2xl font-bold rounded-clay-lg shadow-clay-success flex items-center justify-center gap-3 transition-all cursor-pointer"
          aria-label="Я принял лекарство, остановить будильник"
        >
          <div className="w-10 h-10 rounded-full bg-white text-clay-success flex items-center justify-center shrink-0 shadow-xs">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
          <span>Я принял</span>
        </button>

        {/* Honest snooze: really re-alarms in 5 minutes (see App.tsx) */}
        <button
          id="btn-postpone-alarm"
          onClick={handleSnoozeClick}
          aria-label="Отложить сигнал на 5 минут — напомнит о лекарстве снова"
          className="text-white/70 hover:text-white text-sm font-medium py-2 text-center cursor-pointer underline decoration-white/30 underline-offset-4"
        >
          Отложить на 5 минут
        </button>
      </div>
    </div>
  );
};
