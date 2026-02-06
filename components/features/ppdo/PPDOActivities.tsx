"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const events = [
  {
    title: "Provincial Project Monitoring and Field Validation",
    date: "March 12, 2026",
    location: "Capitol Complex, Tarlac City",
    image: "/news-events/Monitoring and Evaluation of Government Development Programs.png",
  },
  {
    title: "Investment Promotion and Local Economic Development Forum",
    date: "April 2, 2026",
    location: "Provincial Training Center",
    image: "/news-events/Investment Promotion and Local Economic Development Support.png",
  },
  {
    title: "Program Performance Review and Impact Assessment Workshop",
    date: "April 22, 2026",
    location: "PPDO Conference Hall",
    image: "/news-events/Program Performance Review and Impact Assessment.png",
  },
];

const news = [
  {
    title: "2025 Provincial Development Plan midterm review completed",
    date: "January 15, 2026",
    category: "Planning",
    image: "/news-events/Development Program Review and Strategic Assessment.png",
  },
  {
    title: "PPDO publishes 2026 public investment program matrix",
    date: "January 9, 2026",
    category: "Investment",
    image: "/news-events/Economic Development Planning and Investment Support.png",
  },
  {
    title: "Provincial monitoring report highlights on-track projects",
    date: "December 22, 2025",
    category: "Monitoring",
    image: "/news-events/Government Project Monitoring and Compliance Review.png",
  },
  {
    title: "Inter-agency planning coordination workshop conducted",
    date: "December 11, 2025",
    category: "Coordination",
    image: "/news-events/Inter-Agency Planning and Coordination Workshop.png",
  },
  {
    title: "Policy implementation monitoring session with LGUs",
    date: "November 28, 2025",
    category: "Policy",
    image: "/news-events/Policy Implementation Monitoring and Evaluation Session.png",
  },
  {
    title: "Public-private investment engagement program launched",
    date: "November 14, 2025",
    category: "Partnerships",
    image: "/news-events/Investment Facilitation and Business Development Initiatives.png",
  },
];

export default function PPDOActivities() {
  const bulletinImages = [
    "/news-events/Monitoring and Evaluation of Government Development Programs.png",
    "/news-events/Investment Promotion and Local Economic Development Support.png",
    "/news-events/Program Performance Review and Impact Assessment.png",
    "/news-events/Development Program Review and Strategic Assessment.png",
  ];
  const [bulletinIndex, setBulletinIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBulletinIndex((prev) =>
        prev === bulletinImages.length - 1 ? 0 : prev + 1
      );
    }, 2000);

    return () => clearInterval(intervalId);
  }, [bulletinImages.length]);

  return (
    <section
      className="bg-[#f8f8f8] py-20"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.35em] text-xs text-gray-600 mb-2">
            Updates and Highlights
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#012130]">
            News and Events
          </h2>
          <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
            Latest initiatives, announcements, and scheduled activities from the PPDO.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
          {/* LEFT: FEATURE + EVENTS */}
          <div className="space-y-6">
            <div className="bg-white/85 border border-[#012130]/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="relative h-[260px] sm:h-[300px]">
                <div className="absolute inset-0 transition-transform duration-500 ease-out">
                  <Image
                    src={bulletinImages[bulletinIndex]}
                    alt="Provincial bulletin"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c3823]/75 via-[#0c3823]/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/80">
                    Provincial Bulletin
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-semibold mt-2">
                    Provincial Development Updates
                  </h3>
                  <p className="mt-2 text-sm text-white/90 max-w-md">
                    Official releases, program milestones, and coordination activities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/85 border border-[#012130]/10 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#012130]">
                  Upcoming Events
                </h3>
                <span className="text-xs text-[#012130]/60">2026 schedule</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {events.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[#012130]/10 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="relative w-full h-[140px]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-[#012130] font-semibold leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">{item.date}</p>
                      <p className="text-xs text-gray-600">{item.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: NEWS LIST */}
          <div className="bg-white/85 border border-[#012130]/10 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#012130]">
                PPDO News
              </h3>
              <span className="text-xs text-[#012130]/60">Latest bulletins</span>
            </div>

            <div className="space-y-5">
              {news.map((item, index) => (
                <div
                  key={item.title}
                  className={`flex gap-4 ${index !== 0 ? "pt-5 border-t border-[#012130]/10" : ""}`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={90}
                    height={70}
                    className="rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#012130]/60 mb-1">
                      {item.category}
                    </p>
                    <p className="text-sm text-[#012130] font-semibold leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
