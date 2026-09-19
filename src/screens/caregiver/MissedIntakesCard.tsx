import React, { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { intakeRepository, type IntakeLogRow } from '../../repositories/intakeRepository';

export const MissedIntakesCard: React.FC = () => {
  const [rows, setRows] = useState<IntakeLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await intakeRepository.listMisses(8);
      setRows(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить пропуски.');
    }
  };

  useEffect(() => {
    void refresh();
    return intakeRepository.subscribe(() => {
      void refresh();
    });
  }, []);

  return (
    <section className="bg-clay-surface rounded-clay-lg p-4 shadow-clay-spotlight space-y-3">
      <div className="flex items-center gap-2">
        <Pill className="w-5 h-5 text-clay-warning" aria-hidden="true" />
        <h3 className="text-base font-black text-clay-ink">Пропуски приёма</h3>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-clay-danger">
          {error}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm font-semibold text-clay-ink-soft">Пропусков нет — приёмы подтверждены или ещё не наступили.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="bg-clay-surface-sunken rounded-clay-md px-3 py-2 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-clay-ink truncate">{row.medication_name}</p>
                <p className="text-xs font-semibold text-clay-ink-soft">
                  {new Date(row.scheduled_for).toLocaleString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <span className="text-xs font-black text-clay-warning shrink-0">{row.severity ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
