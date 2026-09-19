import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export type StatusKind = 'ok' | 'attention' | 'alert';

export interface StatusBannerProps {
  kind: StatusKind;
  greeting: string;
  dateLabel: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ kind, greeting, dateLabel }) => {
  const ok = kind === 'ok';
  return (
    <section
      aria-live="polite"
      className={`rounded-clay-xl p-5 sm:p-6 shadow-clay-spotlight ${
        ok ? 'bg-clay-ok-soft' : 'bg-clay-warning/15'
      }`}
    >
      <p className="text-sm font-bold text-clay-ink-soft">{dateLabel}</p>
      <h1 className="text-2xl sm:text-3xl font-black text-clay-ink tracking-tight mt-1">{greeting}</h1>
      <div
        className={`mt-3 inline-flex items-center gap-2 min-h-11 px-4 rounded-full font-black text-base ${
          ok ? 'bg-clay-success text-white' : 'bg-clay-warning text-white'
        }`}
      >
        {ok ? (
          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
        ) : (
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        )}
        <span>{ok ? 'Всё в порядке' : kind === 'alert' ? 'Нужно внимание близких' : 'Есть неподтверждённый приём'}</span>
      </div>
    </section>
  );
};
