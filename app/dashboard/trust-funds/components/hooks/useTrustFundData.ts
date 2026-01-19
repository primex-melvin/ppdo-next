// app/dashboard/trust-funds/components/hooks/useTrustFundData.tsx

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import { TrustFund, convertTrustFundFromDB } from "@/types/trustFund.types";

export function useTrustFundData() {
  // Fetch trust funds from Convex
  const trustFundsFromDB = useQuery(api.trustFunds.list);
  const statisticsFromDB = useQuery(api.trustFunds.getStatistics);

  // Convert to frontend format
  const trustFunds = useMemo(() => {
    if (!trustFundsFromDB) return [];
    return trustFundsFromDB.map(convertTrustFundFromDB);
  }, [trustFundsFromDB]);

  // Statistics with defaults
  const statistics = useMemo(() => {
    return {
      totalReceived: statisticsFromDB?.totalReceived || 0,
      totalUtilized: statisticsFromDB?.totalUtilized || 0,
      totalBalance: statisticsFromDB?.totalBalance || 0,
      totalProjects: statisticsFromDB?.totalProjects || 0,
      averageUtilizationRate: statisticsFromDB?.averageUtilizationRate || 0,
    };
  }, [statisticsFromDB]);

  const isLoading = trustFundsFromDB === undefined || statisticsFromDB === undefined;

  return {
    trustFunds,
    statistics,
    isLoading,
  };
}