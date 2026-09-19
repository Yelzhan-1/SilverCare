import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Link2 } from 'lucide-react';
import { authRepository, LinkedElderInfo } from '../../repositories/authRepository';

export interface LinkedElderCardProps {
  userId: string;
}

export const LinkedElderCard: React.FC<LinkedElderCardProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [caregiverProfileId, setCaregiverProfileId] = useState<string | null>(null);
  const [linkedElder, setLinkedElder] = useState<LinkedElderInfo | null>(null);
  const [code, setCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const caregiverProfile = await authRepository.getMyCaregiverProfile(userId);
      setCaregiverProfileId(caregiverProfile?.id ?? null);
      if (caregiverProfile) {
        const elder = await authRepository.getLinkedElderForCaregiver(caregiverProfile.id);
        setLinkedElder(elder);
      }
    } catch (err) {
      console.warn('Failed to load family link status', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Введите код приглашения.');
      return;
    }
    setIsLinking(true);
    try {
      const elderName = await authRepository.acceptInviteCode(code);
      setLinkedElder({ elderlyProfileId: '', displayName: elderName });
      setCode('');
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Код не найден или уже использован. Проверьте код у подопечного.'
      );
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-clay-surface rounded-clay-lg p-4 shadow-clay-spotlight">
        <p className="text-sm text-clay-ink-soft font-semibold">Проверяем связь с подопечным…</p>
      </section>
    );
  }

  if (!caregiverProfileId) return null;

  if (linkedElder) {
    return (
      <section
        id="linked-elder-card"
        className="bg-clay-ok-soft rounded-clay-lg p-4 shadow-clay-spotlight flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-2xl bg-clay-success text-white flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-clay-ink">Связь: {linkedElder.displayName}</h3>
          <p className="text-sm text-clay-ink-soft font-semibold">Доступ к данным подтверждён</p>
        </div>
      </section>
    );
  }

  return (
    <section id="caregiver-link-entry" className="bg-clay-surface rounded-clay-lg p-4 shadow-clay-spotlight space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-clay-primary/10 text-clay-primary flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-clay-ink">Вы ещё не подключены</h3>
          <p className="text-xs text-clay-ink-soft font-semibold">Введите код, который вам дал подопечный</p>
        </div>
      </div>
      <form onSubmit={handleConnect} className="flex gap-2">
        <input
          id="caregiver-dashboard-invite-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Код приглашения"
          className="flex-1 min-h-11 px-3.5 text-base font-bold tracking-wider text-center uppercase rounded-xl bg-clay-surface-sunken text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
        />
        <button
          type="submit"
          disabled={isLinking}
          className="clay-tap min-h-11 px-4 bg-clay-primary disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-clay-primary cursor-pointer shrink-0"
        >
          {isLinking ? '…' : 'Подключиться'}
        </button>
      </form>
      {error && (
        <div role="alert" className="p-2.5 rounded-xl bg-clay-danger/10 text-clay-danger text-sm font-semibold flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
};
