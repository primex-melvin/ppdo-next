// data/changelog-data.ts

export interface ChangelogEntry {
  version: string;
  date: string;
  author: string;
  title: string;
  description?: string;
  changes: ChangelogItem[];
}

export interface ChangelogItem {
  category: "feature" | "improvement" | "bugfix" | "breaking" | "refactor";
  title: string;
  description?: string;
  items?: string[];
}

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "v1.6.0",
    date: "January 19, 2026",
    author: "Melvin Nogoy",
    title: "Major Particulars Management Overhaul & Trust Funds Module",
    description: "Complete redesign of the Particulars Management interface with hierarchical view, advanced search capabilities, and introduction of Trust Funds module with fiscal year organization.",
    changes: [
      {
        category: "feature",
        title: "Particulars Management Redesign",
        description: "Overhauled the entire Particulars UI with a unified, IDE-style hierarchical tree view",
        items: [
          "Single unified tree view: Budget → Projects → Breakdowns with clear visual hierarchy",
          "Inline editing capabilities with hover-triggered edit icons and confirmation dialogs",
          "Year-based filtering with horizontal scrolling year selector",
          "URL state management for shareable views (year, search, sort, expanded nodes)",
          "Real-time search across all hierarchy levels with debouncing",
          "Context menus for quick edit/delete actions with permission awareness",
          "Stair-step animations when changing years with cascading fade effects",
          "Responsive 12-column grid layout for consistent alignment",
        ],
      },
      {
        category: "feature",
        title: "Trust Funds Module",
        description: "Complete trust funds management system with fiscal year organization",
        items: [
          "Fiscal year-based routing structure (/trust-funds/[year])",
          "Year landing page with expandable year cards and statistics",
          "Trust fund CRUD operations with activity logging",
          "Auto-calculated balance and utilization rate tracking",
          "Soft delete with restore and permanent delete capabilities",
          "Search toolbar with export (CSV) and print functionality",
          "Optional date received field with proper type handling",
          "Role-based access control for all operations",
        ],
      },
      {
        category: "feature",
        title: "Fiscal Year Management",
        description: "Introduced fiscal year management system across the platform",
        items: [
          "Fiscal year landing pages with statistics and accordion details",
          "Current year badge display with responsive grid layout",
          "Delete fiscal year functionality with confirmation dialogs",
          "Year-specific statistics calculation and display",
        ],
      },
      {
        category: "improvement",
        title: "Table System Enhancements",
        description: "Major improvements to table functionality and user experience",
        items: [
          "Column visibility controls with hide/show all options",
          "Export to CSV with column filtering capabilities",
          "Print to PDF with customizable column selection",
          "Inline search moved from expandable section to toolbar",
          "Bulk selection and trash operations for administrators",
          "Real-time search across multiple fields with visual feedback",
        ],
      },
      {
        category: "refactor",
        title: "Codebase Modularization",
        description: "Extensive refactoring to improve maintainability and reduce duplication",
        items: [
          "Created shared foundation library (lib/shared/) for utilities, types, and constants",
          "Extracted reusable hooks (useFormattedNumber, useTableState, useAutoSave, useURLParams)",
          "Added service layer for mutations, filtering, and exports",
          "Split monolithic table components into modular, single-responsibility components",
          "Reduced code duplication by ~60% across budget and project modules",
          "Improved TypeScript type safety with explicit type annotations",
          "Eliminated ~1,000+ lines of duplicated logic across modules",
        ],
      },
      {
        category: "improvement",
        title: "Routing & Navigation",
        description: "Migrated to dynamic year-based routing for cleaner URLs",
        items: [
          "Changed from /dashboard/project/budget?year=2026 to /dashboard/project/[year]",
          "Implemented dynamic routing for budget, projects, and trust funds",
          "Updated breadcrumbs for consistent navigation hierarchy",
          "Preserved all existing functionality with no breaking changes",
        ],
      },
      {
        category: "feature",
        title: "Access Control System",
        description: "Implemented particular-level access control with request-based sharing",
        items: [
          "Request-based access sharing for budget particulars",
          "Admin approval workflow for access requests",
          "Fine-grained permission management at particular level",
          "Extended access request system to support particular-level requests",
          "Created budgetParticularSharedAccess schema with comprehensive indexing",
        ],
      },
      {
        category: "feature",
        title: "Modular Spreadsheet System",
        description: "Created reusable spreadsheet component architecture",
        items: [
          "Reusable Spreadsheet component for all table views",
          "Custom hooks for data fetching, state management, and keyboard navigation",
          "Modular components (Container, Header, MenuBar, FormulaBar, Grid, Cell, SheetTabs)",
          "Dynamic column definitions and feature flags",
          "CSV export and print functionality",
          "Full TypeScript support with clear separation of concerns",
        ],
      },
      {
        category: "bugfix",
        title: "TypeScript & Type Safety Fixes",
        description: "Resolved compilation errors and improved type safety throughout the application",
        items: [
          "Fixed ProjectSortField and SortDirection to allow null values",
          "Replaced withMutationHandling with direct mutation calls and proper error handling",
          "Fixed ContextMenuState usage across components",
          "Removed duplicate type declarations",
          "Added type assertions for refs and mutation responses",
          "Removed unused imports across the codebase",
        ],
      },
      {
        category: "improvement",
        title: "UI/UX Enhancements",
        description: "Various improvements to user interface and experience",
        items: [
          "Separated budget and particular access requests with improved UI",
          "Enhanced AccessDeniedPage with responsive design and clear labels",
          "Added icons for better visual hierarchy",
          "Improved placeholder text with helpful examples",
          "Better dark mode support across updated components",
          "Consistent color schemes and styling throughout the application",
        ],
      },
    ],
  },
  {
    version: "v1.5",
    date: "January 14, 2026",
    author: "Alec Quiambao",
    title: "Form Auto-Fill & Year Management",
    description: "Improved form behavior with automatic year population from URL parameters.",
    changes: [
      {
        category: "improvement",
        title: "Form Auto-Fill",
        items: [
          "Year field now auto-fills based on the year in the dashboard URL",
          "Auto-filled fields remain editable with clear '(Auto-filled)' label",
          "Existing records preserve their original year values when edited",
        ],
      },
      {
        category: "improvement",
        title: "Dashboard Updates",
        items: [
          "Adding new items from year-specific dashboard automatically populates that year",
          "Editing existing items preserves current year values",
        ],
      },
      {
        category: "improvement",
        title: "Quality Assurance",
        items: [
          "Verified year auto-fill behavior across all forms",
          "Confirmed existing entries maintain their year values",
          "Updated task documentation with clear test steps",
        ],
      },
    ],
  },
  {
    version: "v1.4",
    date: "January 8, 2026",
    author: "Development Team",
    title: "UI Redesign & Budget Years Landing",
    description: "Major UI overhaul with cleaner layouts and improved user experience.",
    changes: [
      {
        category: "improvement",
        title: "UI Redesign",
        items: [
          "Cleaner card layouts with unified button styles",
          "Better visual hierarchy and consistent color schemes",
          "Improved spacing and mobile responsiveness",
        ],
      },
      {
        category: "improvement",
        title: "Dashboard Updates",
        items: [
          "Polished Budget Statistics metric cards",
          "Activity Log with timeline layout and search/filters",
          "Revamped Budget Table toolbar with dropdown filters",
          "Skeleton loaders for better loading states",
        ],
      },
      {
        category: "feature",
        title: "New Features",
        items: [
          "'New Item Here' quick-add button for faster data entry",
          "Budget Years landing page with year tiles",
          "Click year tiles to auto-filter budget view (client-side)",
        ],
      },
    ],
  },
  {
    version: "v1.3",
    date: "January 8, 2026",
    author: "Development Team",
    title: "Bug Fixes & Character Support",
    description: "Critical bug fixes and improved character support for international names.",
    changes: [
      {
        category: "bugfix",
        title: "Project Creation",
        items: [
          "Fixed 'Failed to create project' message appearing on successful saves",
          "Corrected breadcrumb display on particulars page",
          "Fixed toaster messages for project add/edit operations",
        ],
      },
      {
        category: "improvement",
        title: "Character Support",
        items: [
          "Allowed accented characters (ô, ñ, etc.) in project particulars",
          "Prevented validation errors when using special characters",
        ],
      },
      {
        category: "improvement",
        title: "Error Handling",
        items: [
          "Improved error handling throughout the system",
          "Better user feedback for all operations",
        ],
      },
      {
        category: "feature",
        title: "Budget Years Landing",
        items: [
          "Simple Budget Years landing page showing year tiles",
          "Only displays years with actual budget data",
          "Clicking year opens budget page with auto-filter",
        ],
      },
    ],
  },
  {
    version: "v1.2",
    date: "January 7, 2026",
    author: "Development Team",
    title: "Error Handling Improvements",
    description: "Enhanced error handling and user feedback across the system.",
    changes: [
      {
        category: "bugfix",
        title: "Bug Fixes",
        items: [
          "Fixed 'Failed to create project' message on successful operations",
          "Improved error handling throughout the application",
          "Better user feedback for all system operations",
        ],
      },
    ],
  },
  {
    version: "v1.1",
    date: "January 6, 2026",
    author: "Development Team",
    title: "Code Format & Currency Display",
    description: "Improved budget and project code handling with better currency formatting.",
    changes: [
      {
        category: "improvement",
        title: "Budget & Project Codes",
        items: [
          "Budget and project codes now accept spaces (e.g., '20 DF', 'HEALTH SERVICES')",
          "More flexible code format validation",
        ],
      },
      {
        category: "improvement",
        title: "Currency Input",
        items: [
          "All peso amounts displayed with comma separators (₱1,000,000)",
          "Added slider controls for tracking accomplishment percentages",
          "Improved number input formatting throughout forms",
        ],
      },
    ],
  },
];

// Helper function to get the latest changelog entry
export function getLatestChangelog(): ChangelogEntry {
  return CHANGELOG_DATA[0];
}

// Helper function to get changelog by version
export function getChangelogByVersion(version: string): ChangelogEntry | undefined {
  return CHANGELOG_DATA.find((entry) => entry.version === version);
}

// Helper function to format category badge
export function getCategoryBadgeColor(category: ChangelogItem["category"]): string {
  switch (category) {
    case "feature":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "improvement":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "bugfix":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "breaking":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "refactor":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

// Helper function to get category display name
export function getCategoryDisplayName(category: ChangelogItem["category"]): string {
  switch (category) {
    case "feature":
      return "New Feature";
    case "improvement":
      return "Improvement";
    case "bugfix":
      return "Bug Fix";
    case "breaking":
      return "Breaking Change";
    case "refactor":
      return "Refactor";
    default:
      return category;
  }
}