/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Check, Copy, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { authRepository, AppRole, ProfileRow } from '../../repositories/authRepository';
import { formatInviteCodeForDisplay } from '../../utils/inviteCode';
import { AUTH_FIELD, AUTH_PRIMARY_BTN, AUTH_SECONDARY_BTN } from './authStyles';

interface RoleOnboardingScreenProps {
  userId: string;
  /** Called once the profile (+ role sub-profile, + optionally a link) is fully set up. */
  onComplete: (profile: ProfileRow) => void;
}

type Step =
  | { name: 'role' }
  | { name: 'elderly-invite'; profile: ProfileRow }
  | { name: 'caregiver-code'; profile: ProfileRow };

export const RoleOnboardingScreen: React.FC<RoleOnboardingScreenProps> = ({
  userId,
  onComplete,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [step, setStep] = useState<Step>({ name: 'role' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickRole = async (role: AppRole) => {
    setError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Пожалуйста, введите ваше имя.');
      return;
    }
    setIsSubmitting(true);
    try {
      const profile = await authRepository.completeOnboarding({
        userId,
        role,
        displayName: trimmedName,
      });
      setStep(
        role === 'elderly' ? { name: 'elderly-invite', profile } : { name: 'caregiver-code', profile }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step.name === 'role') {
    return (
      <div className="min-h-screen w-full bg-clay-bg flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-black text-clay-ink tracking-tight text-center">
            Добро пожаловать!
          </h1>
          <p className="text-sm sm:text-base text-clay-ink-soft font-medium text-center mt-1 mb-6">
            Как вас зовут и кто вы?
          </p>

          <label htmlFor="onboarding-name" className="block text-xs font-semibold text-clay-ink-soft mb-1.5 uppercase tracking-wider">
            Ваше имя
          </label>
          <input
            id="onboarding-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Например: Анна Ивановна"
            className={`${AUTH_FIELD} mb-5`}
            aria-invalid={Boolean(error)}
          />

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-clay-md bg-clay-danger/10 text-clay-danger text-sm font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              id="btn-role-elderly"
              disabled={isSubmitting}
              onClick={() => handlePickRole('elderly')}
              className="clay-tap w-full min-h-[88px] p-4 rounded-clay-lg bg-clay-primary/8 shadow-clay-raised-sm hover:brightness-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center gap-4 text-left transition-all cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <div className="w-14 h-14 rounded-2xl bg-clay-primary/15 text-3xl flex items-center justify-center shrink-0">
                👵
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-clay-ink">Я пользуюсь SilverCare</h3>
                <p className="text-xs sm:text-sm text-clay-ink-soft font-semibold">
                  Крупные кнопки, напоминания о лекарствах
                </p>
              </div>
            </button>

            <button
              type="button"
              id="btn-role-caregiver"
              disabled={isSubmitting}
              onClick={() => handlePickRole('caregiver')}
              className="clay-tap w-full min-h-[88px] p-4 rounded-clay-lg bg-clay-danger/8 shadow-clay-raised-sm hover:brightness-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center gap-4 text-left transition-all cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <div className="w-14 h-14 rounded-2xl bg-clay-danger/15 text-3xl flex items-center justify-center shrink-0">
                ❤️
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-clay-ink">Я родственник / опекун</h3>
                <p className="text-xs sm:text-sm text-clay-ink-soft font-semibold">
                  Слежу за близким, получаю уведомления
                </p>
              </div>
            </button>
          </div>

          {isSubmitting && (
            <p className="text-center text-xs text-clay-ink-soft font-semibold mt-4">Сохраняем…</p>
          )}
        </div>
      </div>
    );
  }

  if (step.name === 'elderly-invite') {
    return (
      <ElderlyInviteStep profile={step.profile} onDone={() => onComplete(step.profile)} />
    );
  }

  return (
    <CaregiverCodeStep profile={step.profile} onDone={() => onComplete(step.profile)} />
  );
};

// ---------------------------------------------------------------------------

const ElderlyInviteStep: React.FC<{ profile: ProfileRow; onDone: () => void }> = ({
  profile,
  onDone,
}) => {
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const elderlyProfile = await authRepository.getMyElderlyProfile(profile.id);
        if (!elderlyProfile) throw new Error('Профиль подопечного не найден.');
        const link = await authRepository.getOrCreatePendingInvite(elderlyProfile.id);
        if (!cancelled) setCode(link.invite_code);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось создать код приглашения.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API may be unavailable (permissions/insecure context) —
      // the code is still visible on screen to copy by hand.
    }
  };

  return (
    <div className="min-h-screen w-full bg-clay-bg flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised p-6 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-clay-primary/10 text-clay-primary flex items-center justify-center mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-clay-ink tracking-tight">
          Пригласите опекуна
        </h1>
        <p className="text-sm text-clay-ink-soft font-medium mt-1 mb-6">
          Дайте этот код сыну, дочери или тому, кто будет вам помогать
        </p>

        {isLoading && <p className="text-clay-ink-soft font-semibold py-6">Создаём код…</p>}

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-clay-md bg-clay-danger/10 text-clay-danger text-sm font-semibold flex items-start gap-2 text-left"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {code && (
          <>
            <div className="bg-clay-surface-sunken rounded-clay-lg py-6 px-4 mb-4">
              <div
                id="elderly-invite-code"
                className="text-4xl sm:text-5xl font-black tracking-[0.15em] text-clay-primary-ink font-mono"
              >
                {formatInviteCodeForDisplay(code)}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-invite-code"
              onClick={handleCopy}
              className={`${AUTH_PRIMARY_BTN} mb-3 flex items-center justify-center gap-2.5 ${
                copied ? 'bg-clay-success shadow-clay-success' : ''
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Скопировано!' : 'Скопировать код'}</span>
            </button>
          </>
        )}

        <button
          type="button"
          id="btn-onboarding-continue"
          onClick={onDone}
          className={`${AUTH_SECONDARY_BTN} flex items-center justify-center gap-2`}
        >
          <span>Готово, перейти в приложение</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const CaregiverCodeStep: React.FC<{ profile: ProfileRow; onDone: () => void }> = ({
  onDone,
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elderName, setElderName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Введите код приглашения.');
      return;
    }
    setIsSubmitting(true);
    try {
      const name = await authRepository.acceptInviteCode(code);
      setElderName(name);
    } catch (err) {
      setError(
        err instanceof Error
          ? translateInviteError(err.message)
          : 'Не удалось подключиться. Проверьте код и попробуйте снова.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-clay-bg flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-clay-surface rounded-clay-xl shadow-clay-raised p-6 sm:p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-clay-danger/10 text-clay-danger flex items-center justify-center mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-clay-ink tracking-tight">
          Подключитесь к подопечному
        </h1>

        {elderName ? (
          <>
            <p className="text-sm text-clay-ink-soft font-medium mt-1 mb-6">
              Готово!
            </p>
            <div className="p-4 rounded-clay-lg bg-clay-success/10 text-clay-success font-bold mb-6 flex items-center justify-center gap-2">
              <Check className="w-5 h-5 shrink-0" />
              <span>Вы связаны с {elderName}</span>
            </div>
            <button
              type="button"
              id="btn-onboarding-continue"
              onClick={onDone}
              className={AUTH_PRIMARY_BTN}
            >
              Перейти в приложение
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-clay-ink-soft font-medium mt-1 mb-6">
              Введите код, который вам дал подопечный
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                id="caregiver-invite-code-input"
                type="text"
                autoCapitalize="characters"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Например: K7X PQ29"
                className={`${AUTH_FIELD} h-16 min-h-16 text-2xl font-black text-center tracking-[0.1em] font-mono uppercase`}
                aria-invalid={Boolean(error)}
              />

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-clay-md bg-clay-danger/10 text-clay-danger text-sm font-semibold flex items-start gap-2 text-left"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-accept-invite-code"
                disabled={isSubmitting}
                className={AUTH_PRIMARY_BTN}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Подключаем…' : 'Подключиться'}
              </button>
            </form>

            <button
              type="button"
              id="btn-skip-invite-code"
              onClick={onDone}
              className="mt-4 min-h-11 px-3 text-sm font-semibold text-clay-ink-soft hover:text-clay-ink cursor-pointer underline underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary rounded-lg"
            >
              Пропустить, подключусь позже
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function translateInviteError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('не найден') || lower.includes('использован')) return message;
  if (lower.includes('не является профилем опекуна')) return message;
  return 'Код не найден или уже использован. Проверьте код у подопечного и попробуйте снова.';
}
