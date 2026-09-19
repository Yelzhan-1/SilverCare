import React from 'react';
import { User, Heart, X, Check, ArrowRight, ShieldCheck, Settings, Wrench } from 'lucide-react';
import { UserRole } from '../types/silvercare';
import { audioAlarmService } from '../services/audioAlarmService';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
  onOpenFaceIdDemo: () => void;
  /** Discreet entry to medication list / caregiver settings */
  onOpenSettings?: () => void;
  /** Discreet entry to the jury demo scenarios panel */
  onOpenDemoControl?: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  activeRole,
  onSelectRole,
  onClose,
  onOpenFaceIdDemo,
  onOpenSettings,
  onOpenDemoControl,
}) => {
  if (!isOpen) return null;

  const handleChoose = (role: UserRole) => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(40);
    onSelectRole(role);
    onClose();
  };

  return (
    <div
      id="role-switcher-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="role-switcher-panel"
        className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-black/[0.06] space-y-4 text-center"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-2xl font-black text-[#1C1C1E] tracking-tight">
              Кто вы?
            </h3>
            <p className="text-xs text-[#8E8E93] font-medium">
              Выберите удобный режим работы с SilverCare
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {/* Card 1: Elder Mode */}
          <button
            onClick={() => handleChoose('elderly')}
            className={`w-full min-h-[96px] p-4 rounded-3xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
              activeRole === 'elderly'
                ? 'border-[#007AFF] bg-[#007AFF]/5 shadow-sm'
                : 'border-black/[0.08] hover:bg-[#F2F2F7]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-3xl flex items-center justify-center shrink-0">
                👵
              </div>
              <div>
                <h4 className="text-lg font-black text-[#1C1C1E]">
                  Я пользуюсь SilverCare
                </h4>
                <p className="text-xs text-[#8E8E93] font-semibold">
                  Анна Павловна • Крупные кнопки, максимальная простота
                </p>
              </div>
            </div>

            {activeRole === 'elderly' && (
              <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Card 2: Caregiver Mode */}
          <button
            onClick={() => handleChoose('caregiver')}
            className={`w-full min-h-[96px] p-4 rounded-3xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
              activeRole === 'caregiver'
                ? 'border-[#FF2D55] bg-[#FF2D55]/5 shadow-sm'
                : 'border-black/[0.08] hover:bg-[#F2F2F7]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#FF2D55]/10 text-3xl flex items-center justify-center shrink-0">
                ❤️
              </div>
              <div>
                <h4 className="text-lg font-black text-[#1C1C1E]">
                  Я родственник / опекун
                </h4>
                <p className="text-xs text-[#8E8E93] font-semibold">
                  Сын Алексей • Контроль лекарств, маршрут, безопасность
                </p>
              </div>
            </div>

            {activeRole === 'caregiver' && (
              <div className="w-6 h-6 rounded-full bg-[#FF2D55] text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Face ID Demo Link */}
        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between px-2 text-xs">
          <span className="text-[#8E8E93]">Вход по биометрии:</span>
          <button
            onClick={() => {
              onClose();
              onOpenFaceIdDemo();
            }}
            className="text-[#007AFF] font-bold hover:underline cursor-pointer"
          >
            👤 Проверить Face ID
          </button>
        </div>

        {/* Discreet secondary entries: caregiver settings & jury demo tools.
            Intentionally small/quiet — not part of the elderly main scenario. */}
        {(onOpenSettings || onOpenDemoControl) && (
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-center gap-4 text-xs">
            {onOpenSettings && (
              <button
                id="btn-more-menu-settings"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Настройки и лекарства</span>
              </button>
            )}
            {onOpenDemoControl && (
              <button
                id="btn-more-menu-demo"
                onClick={() => {
                  onClose();
                  onOpenDemoControl();
                }}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Демо для жюри</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
