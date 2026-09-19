import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Check, Phone } from 'lucide-react';
import { alertRepository, type AlertRow } from '../../repositories/alertRepository';
import { subscribeCaregiverPush } from '../../services/pushService';
import { emergencyService } from '../../services/emergency/emergencyService';

interface AlertInboxProps {
  userId: string;
}

const ACTIVE = new Set(['countdown', 'confirmed', 'notified']);

function statusLabel(status: string): string {
  switch (status) {
    case 'countdown':
      return 'Идёт таймер';
    case 'confirmed':
      return 'Подтверждена';
    case 'notified':
      return 'Уведомление отправлено';
    case 'acknowledged':
      return 'Вы занимаетесь';
    case 'cancelled':
      return 'Отменена';
    case 'resolved':
      return 'Закрыта';
    default:
      return status;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'missed_medication':
      return 'Приём не подтверждён';
    case 'fall_detection':
      return 'Резкое движение';
    case 'manual_sos':
      return 'SOS';
    default:
      return type;
  }
}

export const AlertInbox: React.FC<AlertInboxProps> = ({ userId }) => {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [pushStatus, setPushStatus] = useState<string>('Готовим уведомления…');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const list = await alertRepository.listAlerts(20);
      setRows(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить историю.');
    }
  };

  useEffect(() => {
    void refresh();
    const unsub = alertRepository.subscribeToAlerts((row) => {
      setRows((prev) => {
        const next = prev.filter((item) => item.id !== row.id);
        return [row, ...next].slice(0, 20);
      });
      if (
        row.type !== 'missed_medication' &&
        (ACTIVE.has(row.status) || row.status === 'acknowledged')
      ) {
        emergencyService.applyRemoteEvent(row);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    subscribeCaregiverPush(userId)
      .then((result) => {
        if (cancelled) return;
        if (result === 'ok') setPushStatus('Web Push включён на этом устройстве');
        else if (result === 'no-vapid') setPushStatus('Нет VITE_VAPID_PUBLIC_KEY — push не подписан');
        else if (result === 'denied') setPushStatus('Разрешите уведомления в браузере');
        else setPushStatus('Этот браузер не поддерживает Web Push');
      })
      .catch((err) => {
        if (!cancelled) setPushStatus(err instanceof Error ? err.message : 'Ошибка подписки push');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const active = rows.find((row) => ACTIVE.has(row.status));

  return (
    <section className="bg-clay-surface rounded-clay-lg p-4 shadow-clay-spotlight space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-clay-ink">История тревог</h3>
          <p className="text-sm text-clay-ink-soft font-semibold">{pushStatus}</p>
        </div>
        <Bell className="w-5 h-5 text-clay-primary shrink-0" />
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-clay-danger">
          {error}
        </p>
      )}

      {active ? (
        <div id="guardian-active-alert" className="p-3 rounded-clay-md bg-clay-danger/10 space-y-2">
          <div className="flex items-center gap-2 text-clay-danger font-black text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {typeLabel(active.type)} · {statusLabel(active.status)}
              {active.severity ? ` · ${active.severity}` : ''}
            </span>
          </div>
          <p className="text-sm text-clay-ink-soft">
            {new Date(active.triggered_at ?? '').toLocaleString('ru-RU')}. Это не вызов скорой.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void alertRepository.acknowledgeAlert(active.id).then(refresh)}
              className="clay-tap min-h-11 px-3 bg-clay-primary text-white text-sm font-bold rounded-xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Я проверяю
            </button>
            <a
              href="tel:+77015550192"
              className="min-h-11 px-3 bg-clay-ink text-white text-sm font-bold rounded-xl inline-flex items-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <Phone className="w-4 h-4 mr-1" />
              Позвонить
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-clay-ink-soft font-semibold">Сейчас активных тревог нет</p>
      )}

      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {rows.map((row) => (
          <li
            key={row.id}
            className="text-sm font-semibold text-clay-ink flex items-center justify-between gap-2 bg-clay-surface-sunken rounded-xl px-3 py-2"
          >
            <span className="truncate">
              {typeLabel(row.type)} · {statusLabel(row.status)}
              {row.severity ? ` · ${row.severity}` : ''}
            </span>
            <span className="text-clay-ink-soft shrink-0">
              {new Date(row.triggered_at ?? '').toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
