"use client";

export function ExpandingAnimation() {
  return (
    <>
      <style jsx>{`
        @keyframes dramaticEntry {
          0% {
            transform: translateY(0) translateZ(0) scale(0.8);
            opacity: 0;
          }
          15% {
            transform: translateY(0) translateZ(0) scale(1.1);
            opacity: 1;
          }
          30% {
            transform: translateY(0) translateZ(0) scale(1);
            opacity: 1;
          }
          45% {
            transform: translateY(0) translateZ(0) scale(1);
            opacity: 1;
          }
          55% {
            transform: translateY(0) translateZ(200px) scale(2);
            opacity: 1;
          }
          75% {
            transform: translateY(0) translateZ(800px) scale(6);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) translateZ(2000px) scale(12);
            opacity: 0;
          }
        }

        @keyframes dramaticBackground {
          0%,
          25% {
            background: rgb(250 250 250 / 1);
          }
          30% {
            background: rgb(240 240 240 / 1);
          }
          50% {
            background: rgb(180 180 180 / 1);
          }
          60% {
            background: rgb(100 100 100 / 1);
          }
          75% {
            background: rgb(30 30 30 / 1);
          }
          100% {
            background: rgb(0 0 0 / 1);
          }
        }

        @keyframes backgroundBlur {
          0%,
          25% {
            filter: blur(0px);
            opacity: 1;
          }
          30% {
            filter: blur(2px);
            opacity: 0.9;
          }
          40% {
            filter: blur(8px);
            opacity: 0.8;
          }
          50% {
            filter: blur(12px);
            opacity: 0.7;
          }
          60% {
            filter: blur(20px);
            opacity: 0.6;
          }
          75% {
            filter: blur(15px);
            opacity: 0.4;
          }
          100% {
            filter: blur(0px);
            opacity: 0;
          }
        }

        .tube-animation {
          animation: dramaticEntry 5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-transition {
          animation: dramaticBackground 5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .blur-layer {
          animation: backgroundBlur 5s cubic-bezier(0.4, 0, 0.2, 1);
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .container {
          perspective: 500px;
          transform-style: preserve-3d;
        }

        .card-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          will-change: transform;
        }
      `}</style>
      <div className="relative min-h-dvh bg-transition container overflow-hidden">
        {/* Blur layer that goes behind the card */}
        <div className="blur-layer bg-transition" />

        {/* THE CARD WE'RE ENTERING LIKE A TUBE - STAYS SHARP */}
        <div className="card-container origin-center tube-animation">
          <div className="bg-[#f8f8f8] dark:bg-zinc-950 rounded-3xl border-2 border-zinc-300 dark:border-zinc-700 p-8 w-[320px] h-[220px] shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <span className="text-5xl">💾</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                operational
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Database Manager
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              Manage database connections, backups, and query performance
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
