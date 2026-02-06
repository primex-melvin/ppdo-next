// components/ppdo/funds/utils/fundsSpreadsheetConfig.ts

import { SpreadsheetConfig, ColumnDefinition } from "@/components/features/spreadsheet/types";
import { api } from "@/convex/_generated/api";

// Define column definitions for funds
const FUNDS_COLUMNS: ColumnDefinition[] = [
  { key: "projectTitle", label: "Project Title", type: "text", align: "left" },
  { key: "officeInCharge", label: "Office In-Charge", type: "text", align: "left" },
  { key: "status", label: "Status", type: "text", align: "center" },
  { key: "received", label: "Received", type: "currency", align: "right" },
  { key: "obligatedPR", label: "Obligated/PR", type: "currency", align: "right" },
  { key: "utilized", label: "Utilized", type: "currency", align: "right" },
  { key: "balance", label: "Balance", type: "currency", align: "right" },
  { key: "utilizationRate", label: "Utilization Rate", type: "percentage", align: "right" },
  { key: "remarks", label: "Remarks", type: "text", align: "left" },
];

type FundType = 'trust' | 'specialEducation' | 'specialHealth' | 'twentyPercent';

/**
 * Get the appropriate Convex API endpoint based on fund type
 */
function getFundApiEndpoint(fundType: FundType) {
  switch (fundType) {
    case 'trust':
      return api.trustFunds.list;
    case 'specialEducation':
      return api.specialEducationFunds.list;
    case 'specialHealth':
      return api.specialHealthFunds.list;
    case 'twentyPercent':
      return api.twentyPercentDF.list;
    default:
      return api.trustFunds.list;
  }
}

/**
 * Get the table name based on fund type
 */
function getFundTableName(fundType: FundType): string {
  switch (fundType) {
    case 'trust':
      return 'trustFunds';
    case 'specialEducation':
      return 'specialEducationFunds';
    case 'specialHealth':
      return 'specialHealthFunds';
    case 'twentyPercent':
      return 'twentyPercentDF';
    default:
      return 'trustFunds';
  }
}

/**
 * Get the title based on fund type
 */
function getFundTitle(fundType: FundType): string {
  switch (fundType) {
    case 'trust':
      return 'Trust Funds';
    case 'specialEducation':
      return 'Special Education Funds';
    case 'specialHealth':
      return 'Special Health Funds';
    case 'twentyPercent':
      return '20% Development Fund';
    default:
      return 'Funds';
  }
}

/**
 * Create a spreadsheet config for funds based on fund type
 */
export function createFundsSpreadsheetConfig(fundType: FundType): SpreadsheetConfig {
  return {
    tableName: getFundTableName(fundType),
    fetchQuery: getFundApiEndpoint(fundType),
    columns: FUNDS_COLUMNS,
    features: {
      enableExport: true,
      enablePrint: true,
      enableShare: false,
      showTotalsRow: true,
      showTotalsColumn: true,
      viewMode: "viewer",
    },
    title: getFundTitle(fundType),
    accentColor: "#3b82f6",
  };
}

// Export fund types for use in components
export type { FundType };