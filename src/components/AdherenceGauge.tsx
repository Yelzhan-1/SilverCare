import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AdherenceGaugeProps {
  totalCount: number;
  takenCount: number;
  userName: string;
}

export const AdherenceGauge: React.FC<AdherenceGaugeProps> = ({
  totalCount,
  takenCount,
  userName,
}) => {
  const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Calculate needle angle across 180-degree semi-circle (-90 to +90 deg)
  const rotationDeg = -90 + (percentage / 100) * 180;

  return (
    <div
      id="adherence-gauge-card"
      className="relative w-full bg-white rounded-[26px] p-6 pt-7 border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col items-center overflow-hidden"
    >
      {/* Background subtle radial ambient glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-36 bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* SVG Arc Gauge */}
      <div className="relative w-64 h-32 flex items-end justify-center">
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 20 95 A 80 80 0 0 1 180 95"
            fill="none"
            stroke="#E5E5EA"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Foreground Colored Arc */}
          <path
            d="M 20 95 A 80 80 0 0 1 180 95"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (percentage / 100) * 251.2}
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#007AFF" />
              <stop offset="50%" stopColor="#30B0C7" />
              <stop offset="100%" stopColor="#34C759" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Dial Needle Indicator */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transition-transform duration-1000 ease-out pointer-events-none"
          style={{ transform: `translateX(-50%) rotate(${rotationDeg}deg)` }}
        >
          <div className="w-3.5 h-3.5 bg-[#007AFF] border-2 border-white shadow-md rounded-full -top-2 -left-1 absolute" />
        </div>
      </div>

      {/* Percentage Display & Supportive Message */}
      <div className="mt-3 text-center relative z-10">
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-4xl sm:text-5xl font-black text-[#1C1C1E] tracking-tight font-sans">
            {percentage}%
          </span>
          <span className="text-base font-semibold text-[#8E8E93]">
            ({takenCount} из {totalCount})
          </span>
        </div>

        <p className="text-base font-medium text-[#3C3C43]/80 mt-1 max-w-xs">
          {percentage === 100 ? (
            <span className="text-[#34C759] font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-[#34C759]" />
              Все лекарства на сегодня приняты!
            </span>
          ) : (
            `График соблюдается, ${userName.split(' ')[0]}!`
          )}
        </p>
      </div>
    </div>
  );
};
