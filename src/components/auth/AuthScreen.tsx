/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authRepository } from '../../repositories/authRepository';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { AUTH_FIELD, AUTH_PRIMARY_BTN } from './authStyles';

type Mode = 'sign-in' | 'sign-up';

// No callback prop needed: App.tsx already subscribes to
// supabase.auth.onAuthStateChange and will transition to onboarding/the main
// app as soon as sign-in or sign-up produces a session.
export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmailNotice, setCheckEmailNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCheckEmailNotice(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Пожалуйста, заполните почту и пароль.');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'sign-up') {
        const { session } = await authRepository.signUp(trimmedEmail, password);
        if (!session) {
          // Email confirmation is required by this Supabase project — no
          // session yet. Tell the user plainly what to do next. (If a
          // session WAS created, App's onAuthStateChange listener already
          // picks it up and moves on to onboarding automatically.)
          setCheckEmailNotice(true);
        }
      } else {
        await authRepository.signIn(trimmedEmail, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Что-то пошло не так. Попробуйте ещё раз.';
      setError(translateAuthError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-clay-bg flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-clay-surface rounded-clay-xl shadow-clay-raised p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-clay-primary text-white flex items-center justify-center shadow-clay-primary mb-3">
            <Heart className="w-8 h-8 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-clay-ink tracking-tight">
            SilverCare
          </h1>
          <p className="text-sm sm:text-base text-clay-ink-soft font-medium mt-1">
            Забота о здоровье и близких
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-clay-md bg-clay-warning/10 text-clay-warning text-sm font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              Supabase не настроен. Скопируйте <code>.env.example</code> в <code>.env</code> и
              укажите VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
            </span>
          </div>
        )}

        {/* Mode toggle: big, senior-friendly segmented control */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-clay-surface-sunken rounded-clay-md p-1.5">
          <button
            type="button"
            id="btn-auth-mode-signin"
            onClick={() => {
              setMode('sign-in');
              setError(null);
              setCheckEmailNotice(false);
            }}
            className={`clay-tap min-h-12 h-12 rounded-xl text-base font-bold transition-all cursor-pointer hover:brightness-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
              mode === 'sign-in'
                ? 'bg-clay-surface text-clay-ink shadow-clay-raised-sm'
                : 'text-clay-ink-soft'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            id="btn-auth-mode-signup"
            onClick={() => {
              setMode('sign-up');
              setError(null);
              setCheckEmailNotice(false);
            }}
            className={`clay-tap min-h-12 h-12 rounded-xl text-base font-bold transition-all cursor-pointer hover:brightness-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary ${
              mode === 'sign-up'
                ? 'bg-clay-surface text-clay-ink shadow-clay-raised-sm'
                : 'text-clay-ink-soft'
            }`}
          >
            Регистрация
          </button>
        </div>

        {checkEmailNotice ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-clay-primary/10 text-clay-primary flex items-center justify-center">
              <Mail className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-clay-ink">Проверьте почту</h2>
            <p className="text-sm text-clay-ink-soft leading-relaxed">
              Мы отправили письмо для подтверждения на <strong>{email}</strong>. Перейдите по
              ссылке в письме, затем вернитесь и войдите.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('sign-in');
                setCheckEmailNotice(false);
              }}
              className={AUTH_PRIMARY_BTN}
            >
              Перейти ко входу
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-clay-ink-soft mb-1.5 uppercase tracking-wider">
                Электронная почта
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clay-ink-soft" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(error)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mama@example.com"
                  className={`${AUTH_FIELD} pl-12`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-clay-ink-soft mb-1.5 uppercase tracking-wider">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clay-ink-soft" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  aria-invalid={Boolean(error)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={`${AUTH_FIELD} pl-12 pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 rounded-full flex items-center justify-center text-clay-ink-soft hover:text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-clay-md bg-clay-danger/10 text-clay-danger text-sm font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={AUTH_PRIMARY_BTN}
            >
              {isSubmitting
                ? 'Подождите…'
                : mode === 'sign-up'
                ? 'Зарегистрироваться'
                : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/** Maps common Supabase Auth error messages to plain Russian for elderly users. */
function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Неверная почта или пароль. Проверьте и попробуйте снова.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'Этот адрес уже зарегистрирован. Попробуйте войти.';
  }
  if (lower.includes('password should be at least')) {
    return 'Пароль должен быть не короче 6 символов.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Подтвердите почту по ссылке из письма, затем войдите снова.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Слишком много попыток. Подождите немного и попробуйте снова.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Нет соединения с сервером. Проверьте интернет и попробуйте снова.';
  }
  return message;
}
