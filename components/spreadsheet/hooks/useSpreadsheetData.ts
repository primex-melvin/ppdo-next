// app/components/Spreadsheet/hooks/useSpreadsheetData.ts

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { SpreadsheetConfig } from "../types";

/**
 * Hook to fetch and transform spreadsheet data
 */
export function useSpreadsheetData(config: SpreadsheetConfig, filters?: any) {
  // Call the query directly with filters
  const rawData = useQuery(
    config.fetchQuery,
    filters || {}
  );

  const transformedData = useMemo(() => {
    if (!rawData) return [];
    
    // Transform database records to match column definitions
    return rawData.map((item: any) => {
      const transformed: any = {};
      
      config.columns.forEach(col => {
        // Handle special field mappings
        if (col.key === "particular" && item.particulars) {
          transformed[col.key] = item.particulars;
        } else if (item[col.key] !== undefined) {
          transformed[col.key] = item[col.key];
        }
      });
      
      return transformed;
    });
  }, [rawData, config.columns]);

  return {
    data: transformedData,
    isLoading: rawData === undefined,
  };
}