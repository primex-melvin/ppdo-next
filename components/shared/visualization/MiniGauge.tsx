"use client";

import { useAccentColor } from "@/contexts/AccentColorContext";

interface MiniGaugeProps {
  title: string;
  value: number; // 0..100
  max?: number;
}

export function MiniGauge({ title, value, max = 100 }: MiniGaugeProps) {
  const { gradientStart, gradientEnd, accentColorValue } = useAccentColor();
  const clamped = Math.max(0, Math.min(max, value));
  const pct = (clamped / max) * 100;
  const centerX = 80;
  const centerY = 70;
  const radius = 55;
  const needleRotation = (pct / 100) * 180 - 90;

  return (
    <div className="bg-[#f8f8f8] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={title}>{title}</h4>
        <span className="text-sm font-bold" style={{ color: accentColorValue }}>{clamped}%</span>
      </div>
      <div className="relative w-full max-w-[160px] mx-auto" style={{ height: "80px" }}>
        <svg className="w-full h-full" viewBox="0 0 160 80" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={`mini-gauge-${title.replace(/\s+/g, "-")}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke={`url(#mini-gauge-${title.replace(/\s+/g, "-")})`}
            strokeWidth="18"
            strokeLinecap="butt"
          />
          <g style={{ transformOrigin: `${centerX}px ${centerY}px`, transform: `rotate(${needleRotation}deg)` }}>
            <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - radius + 10} stroke={accentColorValue} strokeWidth="3" />
            <circle cx={centerX} cy={centerY} r="4" fill={accentColorValue} />
          </g>
        </svg>
      </div>
    </div>
  );
}



