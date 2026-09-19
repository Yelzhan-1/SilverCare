import React, { useId } from 'react';

interface TimeInput24Props {
  /** Value in strict "HH:MM" 24h format */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/**
 * A locale-independent 24h (HH:MM) time picker.
 *
 * Native `<input type="time">` renders using the OS/browser locale, which on many
 * Windows/US-locale machines shows a 12h AM/PM control even when the page is in
 * Russian. This component guarantees a consistent 24h format everywhere, and uses
 * large touch-friendly selects suitable for senior-friendly forms.
 *
 * Accessibility: the two selects (hours/minutes) together form ONE composite
 * "time" field, so they're grouped in a `<fieldset>` with a `<legend>` (the
 * correct semantic pattern for a multi-part field) rather than a bare
 * `<label>` floating above unrelated inputs.
 */
export const TimeInput24: React.FC<TimeInput24Props> = ({
  value,
  onChange,
  id,
  label,
  className = '',
}) => {
  const generatedId = useId();
  const baseId = id || generatedId;
  const [hh = '09', mm = '00'] = (value || '09:00').split(':');

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${mm}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${hh}:${e.target.value}`);
  };

  return (
    <fieldset id={id} className={`border-0 p-0 m-0 min-w-0 ${className}`}>
      {label && (
        <legend className="block text-xs font-semibold text-clay-ink-soft mb-1 uppercase tracking-wider">
          {label}
        </legend>
      )}
      <div className="flex items-center gap-1.5 h-11 px-2 rounded-xl border border-black/[0.08] bg-clay-surface-sunken focus-within:border-clay-primary focus-within:ring-2 focus-within:ring-clay-primary/20">
        <label className="sr-only" htmlFor={`${baseId}-hh`}>
          Часы
        </label>
        <select
          id={`${baseId}-hh`}
          value={hh}
          onChange={handleHourChange}
          className="flex-1 h-full bg-transparent text-base font-semibold text-clay-ink text-center focus:outline-none cursor-pointer"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-base font-black text-clay-ink-soft" aria-hidden="true">
          :
        </span>
        <label className="sr-only" htmlFor={`${baseId}-mm`}>
          Минуты
        </label>
        <select
          id={`${baseId}-mm`}
          value={mm}
          onChange={handleMinuteChange}
          className="flex-1 h-full bg-transparent text-base font-semibold text-clay-ink text-center focus:outline-none cursor-pointer"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-bold text-clay-ink-soft pr-0.5">24ч</span>
      </div>
    </fieldset>
  );
};
