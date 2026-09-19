import React from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Check,
  ShieldCheck,
  X,
  Volume2,
  HeartHandshake,
} from 'lucide-react';
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
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  event,
  state,
  remainingSeconds,
  onClose,
  isCaregiverView = false,
}) => {
  if (!isOpen && state === 'NORMAL') return null;

  const isCountdown = state === 'COUNTDOWN';
  const isAlerted = state === 'ALERT_CREATED' || state === 'CAREGIVER_NOTIFIED';
  const isAcknowledged = state === 'ACKNOWLEDGED';

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleImOkay = () => {
    emergencyService.cancelEmergency();
    onClose();
  };

  const handleNeedHelp = () => {
    emergencyService.triggerManualSos();
  };

  const handleCaregiverAck = () => {
    emergencyService.acknowledgeByCaregiver('Сын Алексей');
  };

  return (
    <div
      id="emergency-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 ios-blur flex items-center justify-center p-4 font-sans select-none overflow-y-auto"
    >
      <div
        id="emergency-modal-container"
        className="w-full max-w-lg bg-white rounded-[36px] shadow-2xl border-4 border-[#FF3B30] overflow-hidden flex flex-col p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
      >
        {/* Pulsing Warning Icon */}
        <div className="w-24 h-24 rounded-full bg-[#FF3B30] text-white flex items-center justify-center mx-auto shadow-lg mb-4 animate-pulse">
          <AlertTriangle className="w-14 h-14 stroke-[2.5]" />
        </div>

        {/* Header Question */}
        <h2 className="text-2xl sm:text-3xl font-black text-[#1C1C1E] tracking-tight mb-2">
          {isAlerted
            ? '🚨 Сигнал тревоги отправлен!'
            : 'Вам нужна помощь?'}
        </h2>

        <p className="text-base font-semibold text-[#8E8E93] max-w-sm mx-auto mb-4">
          {isAlerted
            ? 'Уведомление отправлено вашему сыну Алексею. Он уже знает и связывается с вами.'
            : isAcknowledged
            ? 'Сын Алексей подтвердил, что занимается ситуацией.'
            : 'Если всё в порядке, нажмите зелёную кнопку ниже.'}
        </p>

        {/* Giant Countdown during waiting phase */}
        {isCountdown && (
          <div className="my-2 py-4 bg-[#FF3B30]/10 rounded-3xl border border-[#FF3B30]/20">
            <span className="text-xs font-bold text-[#FF3B30] uppercase tracking-wider block mb-1">
              Таймер проверки безопасности
            </span>
            <span className="text-6xl sm:text-7xl font-black text-[#FF3B30] font-mono tracking-tighter">
              {formatSeconds(remainingSeconds)}
            </span>
            <span className="text-xs text-[#8E8E93] block mt-2">
              Если вы не ответите, мы автоматически оповестим близких.
            </span>
          </div>
        )}

        {/* Action Buttons for Elderly Person */}
        {!isCaregiverView && (
          <div className="space-y-3 pt-3">
            <button
              id="btn-im-fine"
              onClick={handleImOkay}
              className="w-full min-h-[96px] bg-[#34C759] hover:bg-emerald-600 active:scale-98 text-white font-black text-xl sm:text-2xl rounded-3xl flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-9 h-9 stroke-[3.5]" />
              <span>ДА, Я В ПОРЯДКЕ</span>
            </button>

            <button
              id="btn-need-help"
              onClick={handleNeedHelp}
              className="w-full min-h-[80px] bg-[#FF3B30] hover:bg-red-600 active:scale-98 text-white font-black text-lg sm:text-xl rounded-3xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <AlertTriangle className="w-6 h-6 stroke-[3]" />
              <span>🆘 МНЕ НУЖНА ПОМОЩЬ</span>
            </button>
          </div>
        )}

        {/* Action Buttons for Caregiver View */}
        {isCaregiverView && (
          <div className="space-y-3 pt-3">
            {!isAcknowledged ? (
              <button
                onClick={handleCaregiverAck}
                className="w-full min-h-[80px] bg-[#007AFF] hover:bg-blue-600 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <HeartHandshake className="w-6 h-6" />
                <span>Я УЖЕ ПРОВЕРЯЮ (ПОДТВЕРДИТЬ)</span>
              </button>
            ) : (
              <div className="p-3 bg-[#34C759]/15 text-[#34C759] font-bold rounded-2xl text-center">
                ✓ Вы подтвердили, что занимаетесь ситуацией
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:+77015550192"
                className="h-14 bg-black text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>Позвонить</span>
              </a>

              <button
                onClick={onClose}
                className="h-14 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-bold text-base rounded-2xl flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5 text-[#007AFF]" />
                <span>Маршрут</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 text-center">
          <p className="text-[11px] text-[#8E8E93]">
            SilverCare Safety Prototype • Не заменяет официальные экстренные службы
          </p>
        </div>
      </div>
    </div>
  );
};
