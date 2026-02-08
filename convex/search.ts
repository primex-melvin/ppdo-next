// convex/search.ts
/**
 * Search API re-exports
 * This file re-exports search functions for cleaner API access (api.search instead of api["search/index"])
 */

export {
  indexEntityMutation,
  removeFromIndexMutation,
  search,
  categoryCounts,
  suggestions,
} from "./search/index";
