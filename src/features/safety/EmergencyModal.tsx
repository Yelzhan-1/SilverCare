import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, Check, HeartHandshake, Volume2 } from 'lucide-react';
import {
  emergencyService,
  EmergencyStateMachineState,
} from '../../services/emergency/emergencyService';
import { EmergencyEvent } from '../../types/silvercare';
import { audioAlarmService } from '../../services/audioAlarmService';

interface EmergencyModalProps {
  isOpen: boolean;
  event: EmergencyEvent | null;
  state: EmergencyStateMachineState;
  remainingSeconds: number;
  onClose: () => void;
  isCaregiverView?: boolean;
  online?: boolean;
  lastError?: string | null;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  event,
  state,
  remainingSeconds,
  onClose,
  isCaregiverView = false,
  online = true,
  lastError = null,
}) => {
  const [needsAudioTap, setNeedsAudioTap] = useState(() => !audioAlarmService.isArmed());

  useEffect(() => {
    if (!isOpen || !isCaregiverView) return;
    if (state === 'ACKNOWLEDGED' || state === 'CANCELLED' || state === 'RESOLVED') {
      audioAlarmService.stopAlarmLoop();
      return;
    }
    audioAlarmService.startAlarmLoop('emergency', { force: true });
    setNeedsAudioTap(!audioAlarmService.isArmed());
  }, [isOpen, isCaregiverView, state]);

  if (!isOpen) return null;

  const isCountdown = state === 'COUNTDOWN';
  const isAlerted = state === 'ALERT_CREATED' || state === 'CAREGIVER_NOTIFIED';
  const isAcknowledged = state === 'ACKNOWLEDGED';
  const isOffline = state === 'OFFLINE' || !online;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleImOkay = () => {
    void emergencyService.cancelEmergency();
    onClose();
  };

  const handleNeedHelp = () => {
    void emergencyService.triggerManualSos();
  };

  const title = isAlerted
    ? 'Опекуну отправлено уведомление'
    : isAcknowledged
      ? 'Опекун видит эту тревогу'
      : isOffline
        ? 'Нет сети'
        : 'Вы в порядке?';

  return (
    <div
      id="emergency-modal-backdrop"
      className="fixed inset-0 z-[70] bg-black/85 ios-blur flex items-center justify-center p-4 font-sans select-none overflow-y-auto"
    >
      <div
        id="emergency-modal-container"
        className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised overflow-hidden flex flex-col p-6 sm:p-8 text-center"
      >
        <div className="w-24 h-24 rounded-full bg-clay-danger text-white flex items-center justify-center mx-auto shadow-clay-danger mb-4">
          <AlertTriangle className="w-14 h-14 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-clay-ink tracking-tight mb-2">{title}</h2>

        <p className="text-base font-semibold text-clay-ink-soft max-w-sm mx-auto mb-4">
          {isAlerted
            ? 'Запись сохранена. Если приложение опекуна открыто — он увидит тревогу сразу. Это не вызов скорой.'
            : isAcknowledged
              ? 'Опекун подтвердил, что занимается ситуацией.'
              : 'Если всё в порядке, нажмите зелёную кнопку. Если не ответите, опекун получит уведомление.'}
        </p>

        {(isOffline || lastError) && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-clay-md bg-clay-warning/15 text-clay-warning text-sm font-semibold"
          >
            {lastError || 'Нет сети — онлайн-уведомления недоступны.'}
          </div>
        )}

        {isCountdown && (
          <div className="my-2 py-4 bg-clay-danger/10 rounded-clay-lg">
            <span className="text-xs font-bold text-clay-danger uppercase tracking-wider block mb-1">
              Таймер проверки
            </span>
            <span className="text-6xl sm:text-7xl font-black text-clay-danger font-mono tracking-tighter">
              {formatSeconds(remainingSeconds)}
            </span>
            <span className="text-xs text-clay-ink-soft block mt-2">
              Без ответа опекун получит уведомление автоматически
            </span>
          </div>
        )}

        {!isCaregiverView && (
          <div className="space-y-3 pt-3">
            <button
              type="button"
              id="btn-im-fine"
              onClick={handleImOkay}
              className="clay-tap w-full min-h-[96px] bg-clay-success hover:brightness-105 text-white font-black text-xl sm:text-2xl rounded-clay-lg flex items-center justify-center gap-3 shadow-clay-success cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <Check className="w-9 h-9 stroke-[3.5]" />
              <span>Я В ПОРЯДКЕ</span>
            </button>

            <button
              type="button"
              id="btn-need-help"
              onClick={handleNeedHelp}
              className="clay-tap w-full min-h-[80px] bg-clay-danger hover:brightness-105 text-white font-black text-lg sm:text-xl rounded-clay-lg flex items-center justify-center gap-2 shadow-clay-danger cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <AlertTriangle className="w-6 h-6 stroke-[3]" />
              <span>НУЖНА ПОМОЩЬ</span>
            </button>
          </div>
        )}

        {isCaregiverView && (
          <div className="space-y-3 pt-3">
            {needsAudioTap && (
              <button
                type="button"
                onClick={() => {
                  void audioAlarmService.armAudio().then((ok) => {
                    setNeedsAudioTap(!ok);
                    if (ok) audioAlarmService.startAlarmLoop('emergency', { force: true });
                  });
                }}
                className="clay-tap w-full min-h-11 bg-clay-warning/20 text-clay-ink font-bold text-sm rounded-clay-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
              >
                <Volume2 className="w-5 h-5" />
                Нажмите, чтобы включить звук тревоги
              </button>
            )}
            {!isAcknowledged ? (
              <button
                type="button"
                onClick={() => void emergencyService.acknowledgeByCaregiver()}
                className="clay-tap w-full min-h-[80px] bg-clay-primary hover:brightness-105 active:brightness-95 text-white font-black text-lg rounded-clay-md flex items-center justify-center gap-2 shadow-clay-primary cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
              >
                <HeartHandshake className="w-6 h-6" />
                <span>Я УЖЕ ПРОВЕРЯЮ</span>
              </button>
            ) : (
              <div className="p-3 bg-clay-success/15 text-clay-success font-bold rounded-clay-md text-center">
                Вы подтвердили, что занимаетесь ситуацией
              </div>
            )}

            <a
              href="tel:+77015550192"
              className="h-14 min-h-11 bg-clay-ink text-white font-bold text-base rounded-clay-md flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              <span>Позвонить подопечному</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="clay-tap w-full h-12 min-h-11 bg-clay-surface-sunken hover:brightness-95 active:brightness-90 text-clay-ink font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              Закрыть
            </button>
          </div>
        )}

        {event?.id && (
          <p className="pt-3 text-[11px] text-clay-ink-soft font-mono break-all">id: {event.id}</p>
        )}

        <p className="pt-3 text-[11px] text-clay-ink-soft">
          SilverCare не заменяет официальные экстренные службы
        </p>
      </div>
    </div>
  );
};
