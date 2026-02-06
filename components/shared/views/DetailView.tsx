"use client";

import { ExtendedSystem } from "@/data/systems";
import { getStatusColor } from "@/utils/statusColors";

interface DetailViewProps {
  system: ExtendedSystem;
  onClose: () => void;
}

export function DetailView({ system, onClose }: DetailViewProps) {
  const { details } = system;

  return (
    <>
      <style jsx>{`
        @keyframes zoomOutFromInside {
          from {
            transform: scale(1.3);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes contentReveal {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .detail-zoom-out {
          animation: zoomOutFromInside 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .content-animate {
          animation: contentReveal 0.8s ease-out 0.3s both;
        }
      `}</style>
      <main className="min-h-dvh bg-[#f8f8f8] dark:bg-black detail-zoom-out">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12 content-animate">
          {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Dashboard</span>
          </button>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
              system.status
            )}`}
          >
            {system.status}
          </span>
        </div>

        {/* System Header */}
        <div className="flex items-start gap-6 mb-12">
          <span className="text-7xl animate-[spinAndScale_0.8s_ease-out_0.2s_both]" aria-hidden="true">
            {system.icon}
          </span>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
              {system.name}
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2 animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
              {system.description}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Last updated: {system.lastUpdated}
            </p>
          </div>
        </div>

        {details ? (
          <>
            {/* Metrics */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                Real-Time Metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {details.metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-[#f8f8f8] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
                  >
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Configuration */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                Configuration
              </h2>
              <div className="bg-[#f8f8f8] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(details.configuration).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                        {key}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-50 font-semibold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
                Recent Activity
              </h2>
              <div className="space-y-3">
                {details.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="bg-[#f8f8f8] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-3"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 mt-2 shrink-0" />
                    <p className="text-zinc-900 dark:text-zinc-50">{activity}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="bg-[#f8f8f8] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              No additional details available for this system.
            </p>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
