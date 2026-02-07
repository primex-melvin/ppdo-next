// app/dashboard/page.tsx
"use client";

/**
 * Main Dashboard Landing Page
 *
 * Displays fiscal year cards as the primary dashboard interface.
 * Users select a fiscal year to view year-specific analytics.
 */

import { FiscalYearLanding, DashboardFundSelection } from "@/components/features/ppdo/dashboard/landing";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const handleSelectFund = (fundId: string) => {
    router.push(`/dashboard?view=years&fund=${fundId}`);
  };

  const handleBackToSelection = () => {
    router.push("/dashboard");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (view === "years") {
    return <FiscalYearLanding onBack={handleBackToSelection} />;
  }

  return (
    <div>
      <DashboardFundSelection onSelectFund={handleSelectFund} onBack={handleBackToHome} />
    </div>
  );
}
