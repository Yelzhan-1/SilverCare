import React, { useState, useEffect } from 'react';
import { Heart, Phone, Volume2, X, ShieldCheck, Copy, Check, AlertCircle } from 'lucide-react';
import { familyRepository, FamilyMemberInfo } from '../repositories/familyRepository';
import { authRepository } from '../repositories/authRepository';
import { speechService } from '../services/speechService';
import { audioAlarmService } from '../services/audioAlarmService';
import { formatInviteCodeForDisplay } from '../utils/inviteCode';
import { AUTH_PRIMARY_BTN } from './auth/authStyles';

interface FamilyConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Signed-in elderly user's auth.uid() — used to load the real invite code. */
  userId?: string;
}

export const FamilyConnectionModal: React.FC<FamilyConnectionModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [members, setMembers] = useState<FamilyMemberInfo[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [hasActiveLink, setHasActiveLink] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    familyRepository.getMembers().then(setMembers);

    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const elderly = await authRepository.getMyElderlyProfile(userId);
        if (!elderly) return;
        const [link, allLinks] = await Promise.all([
          authRepository.getOrCreatePendingInvite(elderly.id),
          authRepository.getFamilyLinksForElder(elderly.id),
        ]);
        if (cancelled) return;
        setInviteCode(link.invite_code);
        setHasActiveLink(allLinks.some((row) => row.status === 'active'));
      } catch (err) {
        if (!cancelled) {
          setInviteError(err instanceof Error ? err.message : 'Не удалось загрузить код.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handlePlayVoice = (text?: string) => {
    audioAlarmService.triggerHaptic(30);
    if (text) {
      speechService.speak(text);
    } else {
      speechService.speak('Мама, я всегда рядом. Не забывай пить воду и вовремя принимать лекарства!');
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Code stays visible to copy by hand.
    }
  };

  return (
    <div
      id="family-connection-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="family-connection-panel"
        className="bg-clay-surface w-full max-w-lg rounded-clay-xl shadow-clay-raised overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-clay-danger/10 text-clay-danger flex items-center justify-center">
              <Heart className="w-5 h-5 fill-clay-danger" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-clay-ink">Мои близкие</h3>
              <p className="text-xs text-clay-ink-soft">Семья и опекуны на связи</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface-sunken flex items-center justify-center text-clay-ink-soft hover:brightness-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {hasActiveLink ? (
            <div className="bg-clay-success/10 rounded-clay-md p-3.5 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-clay-success shrink-0" />
              <p className="text-sm font-semibold text-clay-ink leading-relaxed">
                Опекун подключён по коду. Он видит ваши напоминания.
              </p>
            </div>
          ) : (
            <div className="bg-clay-warning/10 rounded-clay-md p-3.5 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-clay-warning shrink-0" />
              <p className="text-sm font-semibold text-clay-ink leading-relaxed">
                Покажите этот код сыну, дочери или тому, кто будет вам помогать.
              </p>
            </div>
          )}

          <div className="bg-clay-surface-sunken rounded-clay-lg p-4 text-center space-y-3">
            <p className="text-xs font-bold text-clay-ink-soft uppercase tracking-wider">
              Код приглашения
            </p>
            {inviteError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-clay-danger/10 text-clay-danger text-xs font-semibold flex items-start gap-1.5 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{inviteError}</span>
              </div>
            )}
            {inviteCode ? (
              <>
                <p
                  id="family-invite-code"
                  className="text-3xl sm:text-4xl font-mono font-black text-clay-primary-ink tracking-[0.12em]"
                >
                  {formatInviteCodeForDisplay(inviteCode)}
                </p>
                <button
                  type="button"
                  id="btn-family-copy-invite"
                  onClick={handleCopy}
                  className={`${AUTH_PRIMARY_BTN} ${
                    copied ? 'bg-clay-success shadow-clay-success' : ''
                  }`}
                >
                  {copied ? <Check className="w-5 h-5 inline mr-2" /> : <Copy className="w-5 h-5 inline mr-2" />}
                  {copied ? 'Скопировано!' : 'Скопировать код'}
                </button>
              </>
            ) : (
              !inviteError && <p className="text-sm text-clay-ink-soft font-semibold py-2">Загружаем код…</p>
            )}
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-clay-surface-sunken rounded-clay-md p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-black/[0.04]"
                  />
                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-clay-ink">{member.name}</h4>
                    <p className="text-xs text-clay-ink-soft">
                      {member.relationshipLabel} • {member.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePlayVoice(member.voicePhraseText)}
                    aria-label={`Голос: ${member.name}`}
                    className="clay-tap min-h-11 min-w-11 rounded-2xl bg-clay-surface hover:brightness-[0.98] text-clay-primary flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <a
                    href={`tel:${member.phone}`}
                    aria-label={`Позвонить ${member.name}`}
                    className="clay-tap min-h-11 min-w-11 rounded-2xl bg-clay-success text-white flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
