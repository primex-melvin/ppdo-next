/**
 * 20% Development Fund API Configuration
 * 
 * API endpoints for 20% DF management (app/dashboard/20_percent_df routes)
 */

import { api } from "@/convex/_generated/api";
import { ProjectApiConfig } from "../types/api.types";

export const twentyPercentDfApi: ProjectApiConfig = {
  queries: {
    list: api.twentyPercentDF.list,
    get: api.twentyPercentDF.get,
    // 20% DF uses direct ID lookup, not particulars
    getByParticulars: undefined,
    getBreakdownStats: undefined,
  },
  mutations: {
    create: api.twentyPercentDF.create,
    update: api.twentyPercentDF.update,
    moveToTrash: api.twentyPercentDF.moveToTrash,
    togglePin: api.twentyPercentDF.togglePin,
    bulkMoveToTrash: api.twentyPercentDF.bulkMoveToTrash,
    bulkUpdateCategory: api.twentyPercentDF.bulkUpdateCategory,
    toggleAutoCalculate: api.twentyPercentDF.toggleAutoCalculateFinancials,
    bulkToggleAutoCalculate: api.twentyPercentDF.bulkToggleAutoCalculate,
  },
};

export const TWENTY_PERCENT_DF_CONFIG = {
  api: twentyPercentDfApi,
  draftKey: "twenty_percent_df_form_draft",
  entityType: "twentyPercentDF" as const,
  entityLabel: "20% Development Fund",
  entityLabelPlural: "20% Development Fund Items",
  routes: {
    base: "/dashboard/20_percent_df",
    detail: (year: string, slug: string) => `/dashboard/20_percent_df/${year}/${slug}`,
  },
};
