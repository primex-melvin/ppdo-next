// components/search/index.ts
/**
 * Search Components Barrel Export
 * 
 * This file provides centralized exports for all search-related components.
 * Import from this file for cleaner imports:
 * 
 *   import { SearchInput, SearchResults, CategorySidebar } from "@/components/search";
 * 
 * Or import individual components:
 * 
 *   import { SearchInput } from "@/components/search/SearchInput";
 */

// Main Components
export { SearchInput } from "./SearchInput";
export { SearchResults } from "./SearchResults";
export { CategorySidebar } from "./CategorySidebar";
export { SearchSkeleton } from "./SearchSkeleton";

// Error States
export { NoResultsState } from "./errors/NoResultsState";

// Card Components (with data types)
export {
  ProjectCard,
  type ProjectCardData,
} from "./cards/ProjectCard";

export {
  TwentyPercentDFCard,
  type TwentyPercentDFCardData,
} from "./cards/TwentyPercentDFCard";

export {
  TrustFundCard,
  type TrustFundCardData,
} from "./cards/TrustFundCard";

export {
  SpecialEducationCard,
  type SpecialEducationCardData,
} from "./cards/SpecialEducationCard";

export {
  SpecialHealthCard,
  type SpecialHealthCardData,
} from "./cards/SpecialHealthCard";

export {
  DepartmentCard,
  type DepartmentCardData,
} from "./cards/DepartmentCard";

export {
  AgencyCard,
  type AgencyCardData,
} from "./cards/AgencyCard";

export {
  UserCard,
  type UserCardData,
} from "./cards/UserCard";
