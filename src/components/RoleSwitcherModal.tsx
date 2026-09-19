import React from 'react';
import { User, Heart, X, Check, ArrowRight, ShieldCheck, Settings, Wrench, LogOut } from 'lucide-react';
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
  /** Signed-in account email (Sprint A), shown so a two-account demo is unambiguous */
  accountEmail?: string;
  onSignOut?: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  activeRole,
  onSelectRole,
  onClose,
  onOpenFaceIdDemo,
  onOpenSettings,
  onOpenDemoControl,
  accountEmail,
  onSignOut,
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
        className="bg-clay-surface w-full max-w-md rounded-clay-xl p-6 shadow-clay-raised space-y-4 text-center"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-left">
            <h3 className="text-2xl font-black text-clay-ink tracking-tight">
              Кто вы?
            </h3>
            <p className="text-xs text-clay-ink-soft font-medium">
              Выберите удобный режим работы с SilverCare
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="clay-tap w-8 h-8 rounded-full bg-clay-surface-sunken flex items-center justify-center text-clay-ink-soft cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {/* Card 1: Elder Mode */}
          <button
            onClick={() => handleChoose('elderly')}
            className={`clay-tap w-full min-h-[96px] p-4 rounded-clay-lg text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
              activeRole === 'elderly'
                ? 'bg-clay-primary/8 shadow-clay-primary ring-2 ring-clay-primary/30'
                : 'bg-clay-surface-sunken hover:brightness-[0.98] shadow-clay-raised-sm'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-clay-primary/10 text-3xl flex items-center justify-center shrink-0">
                👵
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-lg font-black text-clay-ink">
                  Я пользуюсь SilverCare
                </h4>
                <p className="text-xs text-clay-ink-soft font-semibold">
                  Анна Павловна • Крупные кнопки, максимальная простота
                </p>
              </div>
            </div>

            {activeRole === 'elderly' && (
              <div className="w-6 h-6 rounded-full bg-clay-primary text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Card 2: Caregiver Mode */}
          <button
            onClick={() => handleChoose('caregiver')}
            className={`clay-tap w-full min-h-[96px] p-4 rounded-clay-lg text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
              activeRole === 'caregiver'
                ? 'bg-[#FF2D55]/8 shadow-[0_14px_28px_-8px_rgba(255,45,85,0.35)] ring-2 ring-[#FF2D55]/30'
                : 'bg-clay-surface-sunken hover:brightness-[0.98] shadow-clay-raised-sm'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[#FF2D55]/10 text-3xl flex items-center justify-center shrink-0">
                ❤️
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-lg font-black text-clay-ink">
                  Я родственник / опекун
                </h4>
                <p className="text-xs text-clay-ink-soft font-semibold">
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

        {/* Face ID Demo Link — wraps instead of clipping on narrow screens */}
        <div className="pt-2 border-t border-black/[0.06] flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-xs">
          <span className="text-clay-ink-soft">Вход по биометрии:</span>
          <button
            onClick={() => {
              onClose();
              onOpenFaceIdDemo();
            }}
            className="text-clay-primary-ink font-bold hover:underline cursor-pointer"
          >
            👤 Проверить Face ID
          </button>
        </div>

        {/* Discreet secondary entries: caregiver settings & jury demo tools.
            Intentionally small/quiet — not part of the elderly main scenario.
            Wraps onto its own line per item on very narrow screens instead of
            being clipped by the modal edge. */}
        {(onOpenSettings || onOpenDemoControl) && (
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-xs">
            {onOpenSettings && (
              <button
                id="btn-more-menu-settings"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-clay-ink-soft hover:text-clay-ink font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
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
                className="text-clay-ink-soft hover:text-clay-ink font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Демо для жюри</span>
              </button>
            )}
          </div>
        )}

        {/* Signed-in account (Sprint A) — lets a judge cleanly sign out of one
            demo account before signing into the second one. */}
        {onSignOut && (
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 px-1 text-xs">
            <span className="text-clay-ink-soft truncate min-w-0" title={accountEmail}>
              {accountEmail ? `Аккаунт: ${accountEmail}` : 'Аккаунт'}
            </span>
            <button
              id="btn-more-menu-signout"
              onClick={onSignOut}
              className="text-clay-danger font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
