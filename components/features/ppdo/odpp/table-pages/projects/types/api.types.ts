/**
 * API Configuration Types for Project Components
 * 
 * These types enable generic project components to work with different
 * API endpoints (Budget Projects, 20% DF, etc.)
 */

/**
 * Configuration for API endpoints used by project components
 */
export interface ProjectApiConfig {
  queries: {
    list: any;
    get: any;
    getByParticulars?: any;
    getBreakdownStats?: any;
  };
  mutations: {
    create: any;
    update: any;
    moveToTrash: any;
    togglePin: any;
    bulkMoveToTrash: any;
    bulkUpdateCategory: any;
    toggleAutoCalculate: any;
    bulkToggleAutoCalculate: any;
  };
}

/**
 * Configuration options for project components
 */
export interface ProjectComponentConfig {
  api: ProjectApiConfig;
  draftKey: string;
  entityType: string;
  entityLabel: string;
  entityLabelPlural: string;
  routes: {
    base: string;
    detail?: (id: string) => string;
  };
}

/**
 * Props that accept API configuration
 */
export interface WithApiConfigProps {
  apiConfig: ProjectApiConfig;
}
