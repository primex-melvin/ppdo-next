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
    version: "v1.11.0",
    date: "February 17, 2026",
    author: "Melvin Nogoy",
    title: "Office Project Management, Enhanced Agency Detail Page, and Table UX Improvements",
    description: "Major update introducing comprehensive agency detail views, improved table interactions with click animations, and refined UI/UX across the implementing agencies module.",
    changes: [
      {
        category: "feature",
        title: "Enhanced Implementing Agencies Detail Page",
        description: "Complete overhaul of the agency detail page with rich project visualization and management features.",
        items: [
          "Added three project view modes: Compact Folder, Detailed Cards, and List View with tabbed interface",
          "Implemented inline editing for agency full name with hover-to-edit interaction",
          "Added editable contact information (head officer, email, phone, address) with blur-to-save functionality",
          "Created dashboard statistics modal placeholder for future office summary features",
          "Added Total Obligated budget display alongside total allocated and utilized",
          "Implemented agency code breadcrumb for better navigation readability",
          "Statistics card now hidden by default with show/hide toggle",
        ],
      },
      {
        category: "feature",
        title: "Agency Gallery & Table Enhancements",
        description: "Improved navigation and interaction for implementing agencies listing.",
        items: [
          "Added click-to-navigate functionality to agency gallery folder icons",
          "Implemented loading spinner on gallery folder click for better UX",
          "Added mouse-following hover tooltips with agency summary (projects, budget, utilization)",
          "Created viewport edge detection for tooltip positioning",
          "Implemented smooth click animation on all table rows across all modules",
          "Added bulk 'Move to Trash' action to breakdown history table toolbar",
        ],
      },
      {
        category: "feature",
        title: "Agency Data Management",
        description: "New capabilities for managing agency information with data integrity protection.",
        items: [
          "Created resizable edit modal for agency code and full name",
          "Implemented data integrity protection: agency code only editable when no associated projects/breakdowns",
          "Added validation for agency code format (uppercase alphanumeric with underscores/spaces)",
          "Right-click context menu on table rows for quick actions (View, Edit, Delete)",
        ],
      },
      {
        category: "improvement",
        title: "Table UX & Performance",
        description: "Enhanced table interactions and visual feedback across all modules.",
        items: [
          "Subtle click animation on table rows indicating navigation to detail page",
          "Fixed column resizer persistence issues for project detail pages",
          "Removed canEditLayout restriction from column resizing - now available to all users",
          "Added cursor-grab styling to table action buttons for better affordance",
          "Contact info layout updated with icons on right side for consistency",
        ],
      },
      {
        category: "bugfix",
        title: "UI Fixes & Stability",
        description: "Resolved critical UI issues and improved overall stability.",
        items: [
          "Fixed right-click context menu not showing on table rows",
          "Fixed React hooks order violation in AgencyDetailPage",
          "Fixed column width persistence for project detail pages",
          "Fixed missing gap between Cancel and Save Changes buttons in edit modal",
        ],
      },
      {
        category: "refactor",
        title: "Navigation & Architecture",
        description: "Internal improvements to navigation and data structure.",
        items: [
          "Hidden 'Office' menu item from sidebar navigation (deprecated in favor of Implementing Agencies)",
          "Migrated all department API usage to implementingAgencies",
          "Verified no trash items appear in agency detail page project cards (isDeleted filter)",
        ],
      },
    ],
  },
  {
    version: "v1.10.0",
    date: "February 9, 2026",
    author: "Melvin Nogoy",
    title: "Search Engine V2, AIP Reference Code Tracking, and Enhanced Security",
    description: "Major update introducing a powerful search engine with deep-linking and highlighting, AIP reference code data column integration, and PIN verification for critical operations.",
    changes: [
      {
        category: "feature",
        title: "Search Engine V2",
        description: "A comprehensive search system with highlighting, auto-scroll, and navigation across all entities.",
        items: [
          "Implemented global search with text highlighting and cascade animations",
          "Added auto-scroll and highlight for search results with yellow pulse effect",
          "Created 3-level page depth hierarchy for accurate navigation structure",
          "Added author display with avatar and timestamp metadata on result cards",
          "Implemented right-click context menu with 'Copy link' and 'Open in new tab' options",
          "Added page depth indicators (1st page, 2nd page, 3rd page) for better context",
          "Mobile-responsive design with touch-friendly search interface",
          "Support for all entity types: Budget Items, Projects, 20% DF, Trust Funds, SEF, SHF, Departments, Agencies, Users",
          "Fixed single-word query matching and URL generation for all entity types",
          "Relocated search bar to global navbar for easier access",
        ],
      },
      {
        category: "feature",
        title: "AIP Reference Code Integration",
        description: "Added AIP reference code tracking across project and budget management tables.",
        items: [
          "Added aipRefCode column to all relevant data tables",
          "Integrated aipRefCode field in project forms and mapping objects",
          "Enhanced data model to support AIP reference tracking",
        ],
      },
      {
        category: "feature",
        title: "PIN Code Verification for Void Operations",
        description: "Enhanced security for critical table item deletion operations.",
        items: [
          "Implemented PIN verification modal before voiding table items",
          "Added secure authentication check for destructive operations",
          "Prevents accidental deletion of critical budget and project data",
        ],
      },
      {
        category: "improvement",
        title: "UX Enhancements & Context Menus",
        description: "Improved user experience with right-click menus and better navigation.",
        items: [
          "Added right-click context menus to all listing table pages (Projects, 20% DF, Funds)",
          "Added right-click context menu to budget tracking table",
          "Fixed context menu close on outside click (click-outside listener now works)",
          "Wired onContextMenu through ResizableTableRow for consistent UX",
          "Standardized statistics toggle visibility and labeling across dashboard pages",
        ],
      },
      {
        category: "bugfix",
        title: "Search & Navigation Fixes",
        description: "Resolved critical bugs in search result navigation and URL handling.",
        items: [
          "Fixed search result navigation crashes and broken URLs",
          "Corrected project item URL encoding for proper navigation",
          "Restored missing year/parentSlug for all breakdown entities",
          "Added backward-compatible budget item lookup for slug-based URLs",
          "Prevented Convex getByParticulars crash with null return handling",
          "Fixed auto-scroll highlight being cancelled on re-render using ref-based timeout",
          "Resolved budget items navigation from slug-based to ID-based lookups",
        ],
      },
      {
        category: "improvement",
        title: "Search Input & Mobile Responsiveness",
        description: "Enhanced search typing experience and mobile UI.",
        items: [
          "Fixed search input debounce issue preventing cursor jumps during typing",
          "Made category sidebar padding responsive (pt-20 mobile, lg:pt-40 desktop)",
          "Increased search result card spacing on desktop for better readability",
          "Close suggestions dropdown on Enter key press for better UX",
        ],
      },
    ],
  },
  {
    version: "v1.9.0",
    date: "January 29, 2026",
    author: "Melvin Nogoy",
    title: "20% Development Fund (20% DF) Module, Reporting System, and UX Improvements",
    description: "Introduction of the 20% Development Fund module, a new screenshot-integrated reporting system, and significant UX enhancements including a global loader and breadcrumb refactor.",
    changes: [
      {
        category: "feature",
        title: "20% Development Fund (20% DF) Integration",
        description: "A complete end-to-end module for managing the 20% Development Fund, featuring full CRUD, auto-calculation, and stats.",
        items: [
          "Implemented backend architecture (twentyPercentDF, breakdowns, activity logs, shared access)",
          "Added aggregation engine for automatic status and financial total calculations",
          "Created dedicated 20% DF landing page cards and table interfaces",
          "Integrated 20% DF into the shared breakdown framework and sidebar",
          "Added full activity log support for all 20% DF operations",
          "Aligned 20% DF with projects module conventions for a consistent experience",
        ],
      },
      {
        category: "feature",
        title: "Screenshot & Bug Reporting Flow",
        description: "Enhanced maintenance tools with integrated screenshot capture and rich text reports.",
        items: [
          "Integrated screenshot capture using dom-to-image-more with SSR-safe dynamic imports",
          "New ConcernModal for bug reports and feature suggestions with automated capture flow",
          "Enhanced RichTextEditor with ordered lists, video previews, and screenshot auto-sync",
          "Added 'Steps to Replicate' field to bug report schema for better issue tracking",
          "ScreenshotZoom component for seamless transitions between capture and modal views",
        ],
      },
      {
        category: "improvement",
        title: "UI/UX & Navigation Polish",
        description: "Significant improvements to app responsiveness and navigation clarity.",
        items: [
          "Introduced global horizontal loading bar synchronized with app accent colors",
          "Complete Breadcrumb system refactor using centralized utilities and skeleton loaders",
          "Optimized Sidebar with auto-scroll, mobile back buttons, and lazy-loaded badges",
          "Support for recursive nested accordions in navigation sidebar",
          "Custom 404 page with interactive Tarlac-themed 3D illustrations",
          "CMS Coming Soon page and updated dashboard layout with view mode tabs",
        ],
      },
      {
        category: "refactor",
        title: "Architecture & Maintenance",
        description: "Internal improvements for stability and code reusability.",
        items: [
          "Modularized projects module into reusable Header, Body, Toolbar, and Footer components",
          "Implemented automated error recovery and cache clearing (lib/cache-utils.ts)",
          "Reverted slug-based design for a more stable ID-first routing architecture",
          "Global-error and segment-level error pages for deep repair & restart",
          "Resolved Next.js route conflicts caused by overlapping directory structures",
        ],
      },
      {
        category: "bugfix",
        title: "Build & Type Safety",
        description: "Resolved critical build errors and type mismatches.",
        items: [
          "Fixed TypeScript type mismatches in fund breakdown financial metrics",
          "Resolved Convex ID typing issues and schema mismatches in forms",
          "Synced ActivityLogType unions to prevent invalid activity log usage",
          "Fixed missing trackedFields mappings and loading state checks for 20% DF",
          "Corrected Zod validation to support Convex IDs safely across all modules",
        ],
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "January 27, 2026",
    author: "Melvin Nogoy",
    title: "HotFix: Project Breakdown Edit Utilized, Dashboard Redesign, Shared Breakdown Framework",
    description: "Huge update introducing a new dashboard landing experience, a unified breakdown framework for all fund types, and a professional-grade print preview system with interactive editing.",
    changes: [
      {
        category: "feature",
        title: "Dashboard & Navigation Overhaul",
        description: "Redesigned the main dashboard landing with a folder-style interface and streamlined fund selection.",
        items: [
          "New folder-style fiscal year cards for intuitive navigation",
          "Implemented a fluid fund selection flow (Budget, Trust Funds, SEF, SHF)",
          "Integrated real-time charts and graphs with live project data",
          "Added animated category filters with dynamic project counts",
          "Improved landing page typography and responsive grid layout (up to 5 items per row)",
          "Sidebar now persists last-clicked active state for better UX",
          "Added 'NEW' badges to navigation items for discoverability",
        ],
      },
      {
        category: "feature",
        title: "Shared Breakdown Framework",
        description: "Unified the project and trust fund breakdown systems into a single, robust framework.",
        items: [
          "Implemented a shared base schema for all breakdown types (Backend & Frontend)",
          "Added support for Special Education Funds (SEF) and Special Health Funds (SHF)",
          "Centralized financial validation, calculation, and soft-delete helpers",
          "Modularized all breakdown forms (Project, Budget, Trust Funds) into focused subcomponents",
          "Added entity-based activity logging for granular tracking across all fund types",
          "Added utilization percentage column to all breakdown tables",
          "Standardized breadcrumb navigation with clean name extraction",
        ],
      },
      {
        category: "feature",
        title: "Advanced Print Preview & Canvas Architecture",
        description: "A professional document editing and printing system built into the app.",
        items: [
          "Interactive table resizing with live preview and auto-fit capabilities",
          "Support for default and custom table borders in PDF exports",
          "Unified orientation and template selection into a single setup wizard",
          "Inline document title editing and column renaming in preview mode",
          "Dynamic document ruler with margins, indents, and tab stops",
          "Viewer vs. Editor mode toggle for a focused preview experience",
          "Support for pasting images directly from the clipboard into the canvas",
          "Right-click context menus for page management (duplicate/delete)",
          "Enhanced canvas layout with fixed toolbars and upload panels",
          "Triple-fallback thumbnail generation for real-time document previews",
        ],
      },
      {
        category: "refactor",
        title: "UI Component Standardization",
        description: "Massive refactor to unify table and toolbar components across the entire platform.",
        items: [
          "Consolidated all table toolbars into a single, pluggable TableToolbar component",
          "Introduced useTableSearch, useTableSelection, and useTableColumnVisibility hooks",
          "Standardized print preview patterns across all data tables using an adapter pattern",
          "Migrated FiscalYearModal and ColumnVisibilityMenu to shared component library",
          "Modularized the canvas editor into specialized hooks and subcomponents",
          "Full implementation of shadcn tooltips for improved accessibility",
        ],
      },
      {
        category: "improvement",
        title: "Core Data & Inspections",
        description: "Enhanced data visualization and status tracking capabilities.",
        items: [
          "New inspection table gallery with thumbnail image previews and click-to-open lightbox",
          "Added 'On Process' status support across schemas and UI",
          "Optimized Convex queries using bulk fetch to reduce payload size by ~60%",
          "Improved year requirement validation for trust fund tables",
          "Removed OpenAI dependency and unused chat components",
        ],
      },
      {
        category: "bugfix",
        title: "Hotfix for Project Breakdown Edit Utilized",
        description: "Critical correction for budget utilization editing in project breakdowns.",
        items: [
          "Fixed an issue where utilized budget edits in project breakdowns were not being properly recorded or displayed.",
        ],
      },
      {
        category: "bugfix",
        title: "Stability & UX Fixes",
        description: "Resolved critical navigation and rendering issues.",
        items: [
          "Fixed 404 navigation errors on project row clicks by correcting URL encoding",
          "Prevented dropdown action clicks from triggering unintended row navigation",
          "Fixed activity logging for SEF and SHF projects",
          "Ensured table borders and resize handles respect column visibility",
          "Resolved SSR errors in canvas rendering using dynamic imports",
          "Fixed React list key warnings in the page panel",
        ],
      },
    ],
  },
  {
    version: "v1.7",
    date: "January 22, 2026",
    author: "Development Team",
    title: "Budget Summary Statistics & Enhanced Category Management",
    description: "Introducing comprehensive budget statistics and category management tools with improved dashboard visualizations.",
    changes: [
      {
        category: "feature",
        title: "Budget Summary Statistics",
        items: [
          "Added comprehensive budget statistics dashboard",
          "Visual breakdown of budget allocation by category",
          "Real-time calculation of utilized vs. available budgets",
          "Color-coded category cards for quick insights",
        ],
      },
      {
        category: "feature",
        title: "Category Management",
        items: [
          "Enhanced category creation and editing interface",
          "Category-based budget filtering and sorting",
          "Automatic category totals and percentages",
        ],
      },
      {
        category: "improvement",
        title: "Dashboard Enhancements",
        items: [
          "Improved dashboard layout with cleaner grid system",
          "Better color coding for different fund types",
          "Enhanced mobile responsiveness for statistics cards",
        ],
      },
    ],
  },
  {
    version: "v1.6",
    date: "January 15, 2026",
    author: "Development Team",
    title: "Fiscal Year Management & Multi-year Support",
    description: "Added comprehensive fiscal year management with support for multiple years and historical data tracking.",
    changes: [
      {
        category: "feature",
        title: "Multi-Year Support",
        items: [
          "Support for multiple fiscal years in the system",
          "Easy switching between different fiscal years",
          "Historical data preservation across years",
        ],
      },
      {
        category: "feature",
        title: "Year Selection Interface",
        items: [
          "Dedicated fiscal year selector in navigation",
          "Visual indicators for active fiscal year",
          "Year-based data filtering throughout the app",
        ],
      },
      {
        category: "improvement",
        title: "Data Management",
        items: [
          "Improved data organization by fiscal year",
          "Better performance when handling multi-year data",
          "Enhanced reporting capabilities across years",
        ],
      },
    ],
  },
  {
    version: "v1.5",
    date: "January 12, 2026",
    author: "Development Team",
    title: "Auto-fill Current Year & Form Improvements",
    description: "Automatic year population in forms with smart year handling.",
    changes: [
      {
        category: "feature",
        title: "Auto-fill Current Year",
        items: [
          "All forms now auto-fill with current year on load",
          "Year field pre-populated for faster data entry",
          "Smart year detection based on system date",
        ],
      },
      {
        category: "improvement",
        title: "Form Enhancements",
        items: [
          "Improved form validation for year fields",
          "Better UX when creating new items",
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