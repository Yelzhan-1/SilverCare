import React, { useEffect, useRef, useState } from 'react';
import { X, Activity, Moon } from 'lucide-react';
import { requestMotionPermission, startFallDetector, type MotionPermission } from './fallDetection';
import { MicNightMonitorStub, type NightMonitorStatus } from './nightMonitoring';
import { audioAlarmService } from '../../services/audioAlarmService';

export interface WellbeingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPossibleFall: () => void;
  onOpenMyDay: () => void;
  onOpenFamily: () => void;
  onOpenFlashcards: () => void;
}

export const WellbeingPanel: React.FC<WellbeingPanelProps> = ({
  isOpen,
  onClose,
  onPossibleFall,
  onOpenMyDay,
  onOpenFamily,
  onOpenFlashcards,
}) => {
  const [motion, setMotion] = useState<MotionPermission>('prompt');
  const [fallOn, setFallOn] = useState(false);
  const [night, setNight] = useState<NightMonitorStatus>('off');
  const stopFall = useRef<(() => void) | null>(null);
  const nightStub = useRef(new MicNightMonitorStub());

  useEffect(() => {
    return () => {
      stopFall.current?.();
      nightStub.current.stop();
    };
  }, []);

  if (!isOpen) return null;

  const enableFall = async () => {
    const perm = await requestMotionPermission();
    setMotion(perm);
    if (perm !== 'granted') {
      setFallOn(false);
      return;
    }
    stopFall.current?.();
    stopFall.current = startFallDetector({
      onPossibleFall: () => {
        audioAlarmService.triggerHaptic([200, 80, 200]);
        onPossibleFall();
      },
    });
    setFallOn(true);
  };

  const disableFall = () => {
    stopFall.current?.();
    stopFall.current = null;
    setFallOn(false);
  };

  const toggleNight = async () => {
    if (night === 'listening') {
      nightStub.current.stop();
      setNight('off');
      return;
    }
    const status = await nightStub.current.start();
    setNight(status);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised p-5 sm:p-6 space-y-4 my-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-clay-ink">Состояние</h2>
            <p className="text-sm font-semibold text-clay-ink-soft mt-1">
              Датчики помогают заметить резкое движение. Это не диагноз и не замена врачу.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface-sunken flex items-center justify-center text-clay-ink cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <section className="bg-clay-highlight rounded-clay-md p-4 space-y-3 shadow-clay-spotlight">
          <div className="flex items-center gap-2 text-clay-ink font-black">
            <Activity className="w-5 h-5 text-clay-wellbeing" aria-hidden="true" />
            Датчик резкого движения
          </div>
          <p className="text-sm font-semibold text-clay-ink-soft leading-relaxed">
            Если телефон сильно дёрнется, начнётся проверка «Вы в порядке?» — как у кнопки SOS. Это не
            подтверждённое падение.
          </p>
          {motion === 'denied' || motion === 'unavailable' ? (
            <p role="status" className="text-sm font-bold text-clay-warning">
              Датчик движения недоступен. Разрешите доступ в браузере или используйте SOS вручную.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => (fallOn ? disableFall() : void enableFall())}
              className={`clay-tap w-full min-h-14 rounded-clay-md font-black cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
                fallOn ? 'bg-clay-wellbeing text-white shadow-clay-success' : 'bg-clay-surface-sunken text-clay-ink'
              }`}
            >
              {fallOn ? 'Датчик включён' : 'Включить датчик'}
            </button>
          )}
        </section>

        <section className="bg-clay-highlight rounded-clay-md p-4 space-y-3 shadow-clay-spotlight">
          <div className="flex items-center gap-2 text-clay-ink font-black">
            <Moon className="w-5 h-5 text-clay-primary" aria-hidden="true" />
            Ночное наблюдение (макет)
          </div>
          <p className="text-sm font-semibold text-clay-ink-soft leading-relaxed">
            Модуль можно подключить позже. Сейчас это заглушка: микрофон не распознаёт дыхание и не ставит
            диагноз. Помощь сам по себе не вызывает.
          </p>
          {night === 'unavailable' ? (
            <p role="status" className="text-sm font-bold text-clay-warning">
              Микрофон недоступен.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void toggleNight()}
              className={`clay-tap w-full min-h-14 rounded-clay-md font-black cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
                night === 'listening'
                  ? 'bg-clay-primary text-white shadow-clay-primary'
                  : 'bg-clay-surface-sunken text-clay-ink'
              }`}
            >
              {night === 'listening' ? 'Макет слушает микрофон' : 'Включить макет'}
            </button>
          )}
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenMyDay}
            className="clay-tap min-h-14 rounded-clay-md bg-clay-surface-sunken font-bold text-clay-ink cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            Мой день
          </button>
          <button
            type="button"
            onClick={onOpenFamily}
            className="clay-tap min-h-14 rounded-clay-md bg-clay-surface-sunken font-bold text-clay-ink cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            Близкие
          </button>
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="clay-tap min-h-14 rounded-clay-md bg-clay-surface-sunken font-bold text-clay-ink cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            Карточки
          </button>
        </div>
      </div>
    </div>
  );
};
