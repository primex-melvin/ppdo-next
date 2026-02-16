/**
 * Sorting types and interfaces for table sorting functionality
 */

/** Available sort options for dropdown selection */
export type SortOption =
  | "lastModified"
  | "nameAsc"
  | "nameDesc"
  | "allocatedDesc"
  | "allocatedAsc"
  | "obligatedDesc"
  | "obligatedAsc"
  | "utilizedDesc"
  | "utilizedAsc";

/** Display configuration for a sort option */
export interface SortOptionConfig {
  /** The value/identifier for this sort option */
  value: SortOption;
  /** The human-readable label displayed in the UI */
  label: string;
  /** Optional category for grouping related options */
  category?: string;
}

/** Configuration mapping field names to object keys for sorting */
export interface SortFieldMap<T = unknown> {
  /** Field for alphabetical sorting */
  nameField?: keyof T | string;
  /** Field for allocated amount sorting */
  allocatedField?: keyof T | string;
  /** Field for obligated amount sorting */
  obligatedField?: keyof T | string;
  /** Field for utilized amount sorting */
  utilizedField?: keyof T | string;
  /** Field for last modified date sorting */
  modifiedField?: keyof T | string;
}

/** Props for the SortDropdown component */
export interface SortDropdownProps {
  /** Currently selected sort option */
  value: SortOption;
  /** Callback when sort option changes */
  onChange: (value: SortOption) => void;
  /** Optional additional CSS classes */
  className?: string;
}

/** Options for the useSort hook */
export interface UseSortOptions<T = unknown> {
  /** Array of items to sort */
  items: T[];
  /** Initial sort option (defaults to "lastModified") */
  initialSort?: SortOption;
  /** Mapping of sort fields to object keys */
  sortFieldMap?: SortFieldMap<T>;
  /** Whether to persist sort state in URL query params */
  enableUrlPersistence?: boolean;
}

/** Return value of the useSort hook */
export interface UseSortReturn<T = unknown> {
  /** Sorted array of items */
  sortedItems: T[];
  /** Current sort option */
  sortOption: SortOption;
  /** Function to update the sort option */
  setSortOption: (option: SortOption) => void;
}

/** All available sort options with their display labels */
export const SORT_OPTIONS: SortOptionConfig[] = [
  { value: "lastModified", label: "Default: Last Modified", category: "default" },
  { value: "nameAsc", label: "Alphabetically: A-Z", category: "alphabetical" },
  { value: "nameDesc", label: "Alphabetically: Z-A", category: "alphabetical" },
  { value: "allocatedDesc", label: "Allocated: Highest to Lowest", category: "allocated" },
  { value: "allocatedAsc", label: "Allocated: Lowest to Highest", category: "allocated" },
  { value: "obligatedDesc", label: "Obligated: Highest to Lowest", category: "obligated" },
  { value: "obligatedAsc", label: "Obligated: Lowest to Highest", category: "obligated" },
  { value: "utilizedDesc", label: "Utilized: Highest to Lowest", category: "utilized" },
  { value: "utilizedAsc", label: "Utilized: Lowest to Highest", category: "utilized" },
];

/** Budget-specific sort options */
export const BUDGET_SORT_OPTIONS: SortOptionConfig[] = [
  { value: "lastModified", label: "Newest First", category: "default" },
  { value: "nameAsc", label: "Particular: A-Z", category: "alphabetical" },
  { value: "nameDesc", label: "Particular: Z-A", category: "alphabetical" },
  { value: "allocatedDesc", label: "Budget Allocated: High to Low", category: "allocated" },
  { value: "allocatedAsc", label: "Budget Allocated: Low to High", category: "allocated" },
  { value: "obligatedDesc", label: "Obligated Budget: High to Low", category: "obligated" },
  { value: "obligatedAsc", label: "Obligated Budget: Low to High", category: "obligated" },
  { value: "utilizedDesc", label: "Budget Utilized: High to Low", category: "utilized" },
  { value: "utilizedAsc", label: "Budget Utilized: Low to High", category: "utilized" },
];

/** Project-specific sort options */
export const PROJECT_SORT_OPTIONS: SortOptionConfig[] = [
  { value: "lastModified", label: "Newest First", category: "default" },
  { value: "nameAsc", label: "Project Name: A-Z", category: "alphabetical" },
  { value: "nameDesc", label: "Project Name: Z-A", category: "alphabetical" },
  { value: "allocatedDesc", label: "Budget Allocated: High to Low", category: "allocated" },
  { value: "allocatedAsc", label: "Budget Allocated: Low to High", category: "allocated" },
  { value: "obligatedDesc", label: "Obligated Budget: High to Low", category: "obligated" },
  { value: "obligatedAsc", label: "Obligated Budget: Low to High", category: "obligated" },
  { value: "utilizedDesc", label: "Budget Utilized: High to Low", category: "utilized" },
  { value: "utilizedAsc", label: "Budget Utilized: Low to High", category: "utilized" },
];

/** Breakdown-specific sort options */
export const BREAKDOWN_SORT_OPTIONS: SortOptionConfig[] = [
  { value: "lastModified", label: "Newest First", category: "default" },
  { value: "nameAsc", label: "Project Name: A-Z", category: "alphabetical" },
  { value: "nameDesc", label: "Project Name: Z-A", category: "alphabetical" },
  { value: "allocatedDesc", label: "Allocated Budget: High to Low", category: "allocated" },
  { value: "allocatedAsc", label: "Allocated Budget: Low to High", category: "allocated" },
  { value: "obligatedDesc", label: "Obligated Budget: High to Low", category: "obligated" },
  { value: "obligatedAsc", label: "Obligated Budget: Low to High", category: "obligated" },
  { value: "utilizedDesc", label: "Budget Utilized: High to Low", category: "utilized" },
  { value: "utilizedAsc", label: "Budget Utilized: Low to High", category: "utilized" },
];
