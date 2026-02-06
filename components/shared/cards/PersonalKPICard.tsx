"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface PerformanceMetric {
  title: string;
  value: number;
  icon: ReactNode;
  subtitle: string;
  color: "green" | "blue" | "orange" | "red";
}

interface PersonalKPICardProps {
  metrics: PerformanceMetric[];
  showViewMore?: boolean;
}

export function PersonalKPICard({ metrics, showViewMore = true }: PersonalKPICardProps) {
  const { accentColorValue, gradientStart, gradientEnd } = useAccentColor();

  // Calculate overall score as average
  const overallScore = Math.round(
    metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length
  );
  const percentage = Math.min(100, Math.max(0, overallScore));

  // Calculate needle rotation for clock-like arc
  const needleRotation = (percentage / 100) * 180 - 90;

  // SVG dimensions - arc positioned at top like clock
  const centerX = 140;
  const centerY = 120;
  const radius = 100;

  const getColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-500";
      case "blue":
        return "bg-blue-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div className="bg-[#f8f8f8] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-lg flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
            style={{
              backgroundColor: `${accentColorValue}10`,
              color: accentColorValue,
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Overall Performance Score
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Composite of all performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Main Score Display with Speedometer */}
      <div className="mb-6">
        {/* Value Display */}
        <div className="text-center mb-4">
          <p
            className="text-5xl sm:text-6xl font-bold mb-1 leading-tight"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: accentColorValue,
            }}
          >
            {overallScore}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">out of 100</p>
        </div>

        {/* Speedometer Gauge */}
        <div
          className="relative w-full max-w-[280px] mx-auto"
          style={{ height: "140px" }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 280 140"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id="overall-gauge-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={gradientStart} />
                <stop offset="100%" stopColor={gradientEnd} />
              </linearGradient>
            </defs>

            {/* Main gauge arc */}
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
                centerX + radius
              } ${centerY}`}
              fill="none"
              stroke="url(#overall-gauge-gradient)"
              strokeWidth="28"
              strokeLinecap="butt"
            />

            {/* Needle */}
            <g
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
                transform: `rotate(${needleRotation}deg)`,
                transition: "transform 1s ease-out",
              }}
            >
              <line
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={centerY - radius}
                stroke="#1f2937"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <polygon
                points={`${centerX},${centerY - radius} ${centerX - 5},${
                  centerY - radius + 10
                } ${centerX + 5},${centerY - radius + 10}`}
                fill="#1f2937"
              />
            </g>

            {/* Pivot point */}
            <circle
              cx={centerX}
              cy={centerY}
              r="6"
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <circle cx={centerX} cy={centerY} r="3" fill="#9ca3af" />

            {/* Max value label */}
            <text
              x={centerX + radius}
              y={centerY + 15}
              fontSize="12"
              fontWeight="600"
              fill="#6b7280"
              textAnchor="middle"
            >
              100
            </text>
          </svg>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          Score Breakdown
        </h4>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">{metric.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {metric.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {metric.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: "var(--font-cinzel), serif",
                      color: accentColorValue,
                    }}
                  >
                    {metric.value}
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getColorClass(metric.color)} transition-all duration-500 ease-out`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* View More Link */}
        {showViewMore && (
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/dashboard/personal-kpi"
              className="flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: accentColorValue }}
            >
              <span>View More</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

