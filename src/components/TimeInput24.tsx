import React from 'react';

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
 */
export const TimeInput24: React.FC<TimeInput24Props> = ({
  value,
  onChange,
  id,
  label,
  className = '',
}) => {
  const [hh = '09', mm = '00'] = (value || '09:00').split(':');

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${mm}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${hh}:${e.target.value}`);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-[#8E8E93] mb-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div
        id={id}
        className="flex items-center gap-1.5 h-11 px-2 rounded-xl border border-black/[0.08] bg-[#F2F2F7] focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/20"
      >
        <select
          aria-label="Часы"
          value={hh}
          onChange={handleHourChange}
          className="flex-1 h-full bg-transparent text-base font-semibold text-[#1C1C1E] text-center focus:outline-none cursor-pointer"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-base font-black text-[#8E8E93]">:</span>
        <select
          aria-label="Минуты"
          value={mm}
          onChange={handleMinuteChange}
          className="flex-1 h-full bg-transparent text-base font-semibold text-[#1C1C1E] text-center focus:outline-none cursor-pointer"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-bold text-[#8E8E93] pr-0.5">24ч</span>
      </div>
    </div>
  );
};
