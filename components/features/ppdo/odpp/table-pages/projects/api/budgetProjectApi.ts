/**
 * Budget Projects API Configuration
 * 
 * API endpoints for Budget Project management (app/dashboard/project routes)
 */

import { api } from "@/convex/_generated/api";
import { ProjectApiConfig } from "../types/api.types";

export const budgetProjectApi: ProjectApiConfig = {
  queries: {
    list: api.projects.list,
    get: api.projects.get,
    getByParticulars: api.budgetItems.getByParticulars,
    getBreakdownStats: api.govtProjects.getBreakdownStats,
  },
  mutations: {
    create: api.projects.create,
    update: api.projects.update,
    moveToTrash: api.projects.moveToTrash,
    togglePin: api.projects.togglePin,
    bulkMoveToTrash: api.projects.bulkMoveToTrash,
    bulkUpdateCategory: api.projects.bulkUpdateCategory,
    toggleAutoCalculate: api.projects.toggleAutoCalculate,
    bulkToggleAutoCalculate: api.projects.bulkToggleAutoCalculate,
  },
};

export const BUDGET_PROJECT_CONFIG = {
  api: budgetProjectApi,
  draftKey: "project_form_draft",
  entityType: "project" as const,
  entityLabel: "Project",
  entityLabelPlural: "Projects",
  routes: {
    base: "/dashboard/project",
  },
};
