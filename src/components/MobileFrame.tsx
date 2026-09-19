import React, { useState } from 'react';
import { Wifi, Battery, Signal, Sparkles } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  enabled: boolean;
  currentTimeStr: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  enabled,
  currentTimeStr,
}) => {
  const [islandExpanded, setIslandExpanded] = useState(false);

  if (!enabled) {
    return <div className="w-full min-h-screen bg-[#F2F2F7]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#E5E5EA] flex items-center justify-center p-0 sm:p-4 md:p-6 select-none font-sans">
      {/* iPhone 16 Pro Chassis */}
      <div className="relative w-full max-w-[430px] h-screen sm:h-[890px] bg-[#F2F2F7] sm:rounded-[56px] shadow-[0_25px_70px_rgba(0,0,0,0.28),0_10px_25px_rgba(0,0,0,0.15)] sm:border-[12px] border-[#1C1C1E] ring-1 ring-black/20 overflow-hidden flex flex-col">
        {/* Subtle metallic bezel inner edge highlight */}
        <div className="hidden sm:block absolute inset-0 rounded-[44px] pointer-events-none ring-1 ring-white/15 z-50" />

        {/* Top iOS Status Bar + Dynamic Island */}
        <div className="hidden sm:flex absolute top-0 left-0 right-0 h-12 z-40 items-center justify-between px-7 pointer-events-none bg-transparent">
          {/* Left: iOS Time */}
          <div className="w-16 flex items-center text-left">
            <span className="text-[15px] font-semibold text-black tracking-tight font-sans">
              {currentTimeStr || '9:41'}
            </span>
          </div>

          {/* Center: Dynamic Island */}
          <div
            onClick={() => setIslandExpanded(!islandExpanded)}
            className={`pointer-events-auto bg-black text-white flex items-center justify-between transition-all duration-300 ease-out shadow-md cursor-pointer ${
              islandExpanded
                ? 'w-[280px] h-[64px] rounded-[32px] px-4'
                : 'w-[124px] h-[35px] rounded-full px-2.5'
            }`}
          >
            {islandExpanded ? (
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">SilverCare</div>
                    <div className="text-[11px] text-zinc-400">График активен</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-950/60 px-2 py-1 rounded-full">
                  <span>Всё в норме</span>
                </div>
              </div>
            ) : (
              <>
                {/* Face ID sensor lens */}
                <div className="w-3 h-3 rounded-full bg-[#111113] border border-zinc-800/60 ml-0.5 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/80" />
                </div>
                {/* Active indicator dot (green camera/mic or subtle activity pill) */}
                <div className="flex items-center gap-1.5 mr-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,199,89,0.8)]" />
                  <span className="text-[10px] font-bold text-zinc-300">RX</span>
                </div>
              </>
            )}
          </div>

          {/* Right: iOS Cellular, Wi-Fi & Battery */}
          <div className="w-16 flex items-center justify-end gap-1.5 text-black">
            {/* 4G / 5G / Signal Bars */}
            <div className="flex items-end gap-[1.5px] h-3">
              <div className="w-[3px] h-1.5 bg-black rounded-[1px]" />
              <div className="w-[3px] h-2 bg-black rounded-[1px]" />
              <div className="w-[3px] h-2.5 bg-black rounded-[1px]" />
              <div className="w-[3px] h-3 bg-black rounded-[1px]" />
            </div>

            {/* Wi-Fi Icon */}
            <Wifi className="w-3.5 h-3.5 stroke-[2.4]" />

            {/* iOS Battery with fill */}
            <div className="flex items-center">
              <div className="w-5 h-[11px] rounded-[3.5px] border border-black p-[1px] flex items-center">
                <div className="w-full h-full bg-black rounded-[1.5px]" />
              </div>
              <div className="w-[1.5px] h-[4px] bg-black rounded-r-[1px]" />
            </div>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 w-full overflow-y-auto sm:pt-11 relative flex flex-col bg-[#F2F2F7]">
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="h-7 bg-[#F2F2F7] shrink-0 flex items-center justify-center pointer-events-none pb-1">
          <div className="w-36 h-1 bg-black/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};

