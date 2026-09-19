import React from 'react';
import { Brain, RotateCcw, X } from 'lucide-react';
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
  onOpenPairGame: () => void;
  onTriggerDueAlarm: () => void;
  onTriggerMissedEscalation: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  isOpen,
  onClose,
  onSwitchRole,
  onOpenMemorySuite,
  onOpenPairGame,
  onTriggerDueAlarm,
  onTriggerMissedEscalation,
}) => {
  if (!isOpen) return null;

  const tile =
    'clay-tap min-h-14 p-3 bg-clay-surface-sunken rounded-clay-md text-left cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-sans">
      <div className="bg-clay-surface w-full max-w-lg rounded-clay-xl shadow-clay-raised p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-clay-ink">Панель демонстрации</h3>
            <p className="text-sm text-clay-ink-soft">Сценарии для жюри. Скорая не вызывается.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface-sunken flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={tile} onClick={() => { onSwitchRole('elderly'); onClose(); }}>
            <span className="text-sm font-black text-clay-ink">Подопечный</span>
          </button>
          <button type="button" className={tile} onClick={() => { onSwitchRole('caregiver'); onClose(); }}>
            <span className="text-sm font-black text-clay-ink">Опекун</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className={tile}
            onClick={() => {
              onTriggerDueAlarm();
              onClose();
            }}
          >
            <span className="text-sm font-black text-clay-ink">Напоминание о приёме</span>
            <span className="text-xs text-clay-ink-soft">Принял / позже</span>
          </button>
          <button
            type="button"
            className={tile}
            onClick={() => {
              onTriggerMissedEscalation();
              onClose();
            }}
          >
            <span className="text-sm font-black text-clay-warning">Пропуск → LOW/MED/HIGH</span>
            <span className="text-xs text-clay-ink-soft">Быстрая эскалация, не SOS</span>
          </button>
          <button
            type="button"
            className={tile}
            onClick={() => {
              void emergencyService.startCountdown('manual_sos', { reason: 'Демо SOS' }, 15);
              onClose();
            }}
          >
            <span className="text-sm font-black text-clay-danger">SOS 15 секунд</span>
            <span className="text-xs text-clay-ink-soft">Отмена / нужна помощь</span>
          </button>
          <button
            type="button"
            className={tile}
            onClick={() => {
              emergencyService.triggerFallDetectionDemo();
              onClose();
            }}
          >
            <span className="text-sm font-black text-clay-ink">Падение (демо)</span>
            <span className="text-xs text-clay-ink-soft">Не диагноз</span>
          </button>
        </div>

        <button
          type="button"
          className="clay-tap w-full min-h-12 bg-clay-primary text-white rounded-clay-md font-bold cursor-pointer"
          onClick={() => {
            onOpenPairGame();
            onClose();
          }}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          Игра «Найди пары»
        </button>
        <button
          type="button"
          className="clay-tap w-full min-h-11 bg-clay-surface-sunken text-clay-ink rounded-clay-md font-bold cursor-pointer"
          onClick={() => {
            onOpenMemorySuite();
            onClose();
          }}
        >
          Другие упражнения памяти
        </button>

        <button
          type="button"
          onClick={async () => {
            if (confirm('Сбросить демо-данные?')) {
              await storage.clear();
              await medicationRepository.resetToDefaults();
              await scheduleRepository.resetDefaults();
              audioAlarmService.playSuccessChime();
              window.location.reload();
            }
          }}
          className="clay-tap w-full min-h-11 bg-clay-danger/10 text-clay-danger font-bold rounded-clay-md cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          Сбросить демо
        </button>
      </div>
    </div>
  );
};
