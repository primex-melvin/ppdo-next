"use client";

import { ReactNode, useState } from "react";
import { useAccentColor } from "@/contexts/AccentColorContext";

interface DetailedMetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  subtitle: string;
  color: "green" | "blue" | "orange" | "red";
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  target?: number;
  description?: string;
  details?: {
    label: string;
    value: string | number;
  }[];
}

export function DetailedMetricCard({
  title,
  value,
  icon,
  subtitle,
  color,
  trend,
  target,
  description,
  details,
}: DetailedMetricCardProps) {
  const { accentColorValue } = useAccentColor();
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-[#f8f8f8] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4"
              style={{
                backgroundColor: `${accentColorValue}10`,
                color: accentColorValue,
              }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {subtitle}
              </p>
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                trend.isPositive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <svg
                className={`w-3 h-3 ${!trend.isPositive ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>

      {/* Value Display */}
      <div className="mb-4">
        <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/30">
          <p
            className="text-3xl font-bold mb-1 leading-tight"
            style={{
              fontFamily: "var(--font-cinzel), serif",
              color: accentColorValue,
            }}
          >
            {value}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-3">out of 100</p>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getColorClass(color)} transition-all duration-500`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target and Current Value Comparison */}
      {target !== undefined && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Target
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {target}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Current
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: accentColorValue }}
            >
              {value}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getColorClass(color)} transition-all duration-500`}
              style={{
                width: `${Math.min(100, (value / target) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Expand/Collapse Button and Details */}
      {details && details.length > 0 && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            style={{
              color: isExpanded ? accentColorValue : undefined,
            }}
          >
            <span>{isExpanded ? "Hide Breakdown" : "Show Breakdown"}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Key Metrics
              </h4>
              <div className="space-y-1.5">
                {details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-50 dark:bg-zinc-800/30"
                  >
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {detail.label}
                    </span>
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

