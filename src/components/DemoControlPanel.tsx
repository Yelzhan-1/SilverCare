import React from 'react';
import {
  Sparkles,
  Bell,
  Clock,
  AlertTriangle,
  RotateCcw,
  User,
  Heart,
  Brain,
  X,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { emergencyService } from '../services/emergency/emergencyService';
import { notificationService } from '../services/notifications/notificationService';
import { medicationRepository } from '../repositories/medicationRepository';
import { scheduleRepository } from '../repositories/scheduleRepository';
import { storage } from '../services/storage';
import { audioAlarmService } from '../services/audioAlarmService';

interface DemoControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchRole: (role: 'elderly' | 'caregiver') => void;
  onOpenMemorySuite: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  isOpen,
  onClose,
  onSwitchRole,
  onOpenMemorySuite,
}) => {
  if (!isOpen) return null;

  const handleSimulateReminder = (seconds: number) => {
    audioAlarmService.triggerHaptic(30);
    notificationService.sendMedicationReminder('Аспирин Кардио', '1 таблетка');
    onClose();
  };

  const handleSimulateEmergency = (seconds: number) => {
    audioAlarmService.triggerHaptic(50);
    emergencyService.startCountdown(
      'missed_medication',
      { medicationName: 'Аспирин Кардио', reason: 'Истекло время приёма без подтверждения' },
      seconds
    );
    onClose();
  };

  const handleSimulateFall = () => {
    audioAlarmService.triggerHaptic(50);
    emergencyService.triggerFallDetectionDemo();
    onClose();
  };

  const handleTestNotification = async () => {
    const success = await notificationService.sendTestNotification();
    if (!success) {
      alert('Уведомление показано во всплывающей плашке (системные уведомления отключены в браузере).');
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Сбросить демо-данные к начальному состоянию?')) {
      await storage.clear();
      await medicationRepository.resetToDefaults();
      await scheduleRepository.resetDefaults();
      audioAlarmService.playSuccessChime();
      window.location.reload();
    }
  };

  return (
    <div
      id="demo-control-panel-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="demo-control-panel"
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-lg font-black text-[#1C1C1E]">
                Панель демонстрации (Demo Mode)
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Инструменты для жюри и тестирования сценариев
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switchers */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider block">
            1. Переключение роли (Elder ↔ Caregiver):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSwitchRole('elderly');
                onClose();
              }}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-2xl flex items-center gap-2.5 text-left cursor-pointer"
            >
              <span className="text-2xl">👵</span>
              <div>
                <p className="text-xs font-bold text-[#1C1C1E]">Режим подопечного</p>
                <p className="text-[10px] text-[#8E8E93]">Максимальная простота</p>
              </div>
            </button>

            <button
              onClick={() => {
                onSwitchRole('caregiver');
                onClose();
              }}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-2xl flex items-center gap-2.5 text-left cursor-pointer"
            >
              <span className="text-2xl">❤️</span>
              <div>
                <p className="text-xs font-bold text-[#1C1C1E]">Панель опекуна</p>
                <p className="text-[10px] text-[#8E8E93]">Сын Алексей</p>
              </div>
            </button>
          </div>
        </div>

        {/* Medication Reminder Simulators */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider block">
            2. Симуляция напоминания о лекарстве:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSimulateReminder(5)}
              className="py-2.5 px-3 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] text-xs font-bold rounded-xl cursor-pointer"
            >
              💊 Напомнить сейчас
            </button>
            <button
              onClick={() => handleSimulateEmergency(15)}
              className="py-2.5 px-3 bg-[#FF9500]/10 hover:bg-[#FF9500]/20 text-[#FF9500] text-xs font-bold rounded-xl cursor-pointer"
            >
              ⏱️ Таймер 15 сек
            </button>
            <button
              onClick={() => handleSimulateEmergency(45)}
              className="py-2.5 px-3 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] text-xs font-bold rounded-xl cursor-pointer"
            >
              🚨 Таймер 45 сек
            </button>
          </div>
        </div>

        {/* Emergency & Fall Detection */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider block">
            3. Симуляция безопасности и тревоги:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSimulateFall}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl text-left cursor-pointer"
            >
              <span className="text-xs font-bold text-[#1C1C1E] block">⚠️ Падение (прототип)</span>
              <span className="text-[10px] text-[#8E8E93]">20 сек обратный отсчёт</span>
            </button>

            <button
              onClick={handleTestNotification}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl text-left cursor-pointer"
            >
              <span className="text-xs font-bold text-[#1C1C1E] block">🔔 Тест уведомления</span>
              <span className="text-[10px] text-[#8E8E93]">Звук + Web Notification</span>
            </button>
          </div>
        </div>

        {/* Memory Exercises */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider block">
            4. Тренировка памяти:
          </span>
          <button
            onClick={() => {
              onOpenMemorySuite();
              onClose();
            }}
            className="w-full h-11 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Brain className="w-4 h-4" />
            <span>Открыть набор упражнений для памяти</span>
          </button>
        </div>

        {/* Safe Demo Reset */}
        <div className="pt-2 border-t border-black/[0.06]">
          <button
            onClick={handleResetDemo}
            className="w-full h-11 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>🔄 Сбросить демо-состояние к начальному</span>
          </button>
        </div>
      </div>
    </div>
  );
};
