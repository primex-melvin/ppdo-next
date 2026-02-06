"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalKPICard } from "@/components/shared/cards/PersonalKPICard";
import { DetailedMetricCard } from "@/components/shared/cards/DetailedMetricCard";

export default function PersonalKPIPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    } else {
      router.push("/");
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  // Mock performance metrics - replace with actual data from your API
  const metrics = [
    {
      title: "Productivity Score",
      value: 87,
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      subtitle: "Task completion rate",
      color: "green" as const,
    },
    {
      title: "Quality Score",
      value: 92,
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      subtitle: "Work accuracy rate",
      color: "blue" as const,
    },
    {
      title: "Timeliness Score",
      value: 81,
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      subtitle: "On-time completion",
      color: "orange" as const,
    },
    {
      title: "Compliance Score",
      value: 95,
      icon: (
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      subtitle: "Policy adherence",
      color: "green" as const,
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-4">
        <h1
          className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Personal Key Performance Indicator
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Performance metrics and analysis
        </p>
      </div>

      {/* Overall Performance Score and Summary Statistics - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Left Column - Overall Performance Score */}
        <div>
          <PersonalKPICard metrics={metrics} showViewMore={false} />
        </div>

        {/* Right Column - Performance Metrics */}
        <div className="space-y-4">
          {/* Productivity Score */}
          <DetailedMetricCard
            title="Productivity Score"
            value={87}
            icon={
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            subtitle="Task completion rate"
            color="green"
            trend={{ value: 5.2, isPositive: true, period: "vs last month" }}
            target={90}
            details={[
              { label: "Tasks Completed", value: "342" },
              { label: "Completion Rate", value: "87.0%" },
              { label: "Tasks Pending", value: "51" },
            ]}
          />

          {/* Quality Score */}
          <DetailedMetricCard
            title="Quality Score"
            value={92}
            icon={
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            subtitle="Work accuracy rate"
            color="blue"
            trend={{ value: 3.1, isPositive: true, period: "vs last month" }}
            target={95}
            details={[
              { label: "Error-Free Deliverables", value: "418" },
              { label: "Quality Rate", value: "91.9%" },
              { label: "Revisions Required", value: "37" },
            ]}
          />

          {/* Timeliness Score */}
          <DetailedMetricCard
            title="Timeliness Score"
            value={81}
            icon={
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            subtitle="On-time completion"
            color="orange"
            trend={{
              value: -2.5,
              isPositive: false,
              period: "vs last month",
            }}
            target={85}
            details={[
              { label: "On-Time Completions", value: "298" },
              { label: "On-Time Rate", value: "80.9%" },
              { label: "Late Completions", value: "70" },
            ]}
          />

          {/* Compliance Score */}
          <DetailedMetricCard
            title="Compliance Score"
            value={95}
            icon={
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
            subtitle="Policy adherence"
            color="green"
            trend={{ value: 1.8, isPositive: true, period: "vs last month" }}
            target={100}
            details={[
              { label: "Compliant Actions", value: "1,247" },
              { label: "Compliance Rate", value: "95.0%" },
              { label: "Policy Violations", value: "66" },
            ]}
          />
        </div>
      </div>
    </>
  );
}
