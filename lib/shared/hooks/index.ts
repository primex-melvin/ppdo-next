// lib/shared/hooks/index.ts

/**
 * Shared hooks for Budget and Project modules
 * 
 * These hooks eliminate duplicate logic across forms and tables
 */

// Number formatting hook
export {
  useFormattedNumber,
  type UseFormattedNumberReturn,
} from './useFormattedNumber';

// Table state management hook
export {
  useTableState,
  type TableState,
  type TableStateActions,
} from './useTableState';

// Auto-save hooks
export {
  useAutoSave,
  useLoadDraft,
  useClearDraft,
  useHasDraft,
} from './useAutoSave';

// URL parameter hooks
export {
  useURLParams,
  useURLParamsArray,
  useSyncToURL,
  useYearFilter,
} from './useURLParams';

// Data fetching hooks
export {
  useFilteredQuery,
  useMultipleQueries,
  type UseFilteredQueryReturn,
} from './useFilteredQuery';

// Modal state management hooks
export {
  useModal,
  useSimpleModal,
  type ModalState,
  type UseModalReturn,
} from './useModal';

// Form draft management hooks
export {
  useFormDraft,
} from './useFormDraft';

// CRUD action hooks
export {
  useFeatureActions,
  useCreateAction,
  useUpdateAction,
  useDeleteAction,
  useAction,
  type FeatureAction,
  type FeatureActions,
  type FeatureActionConfig,
} from './useFeatureActions';

// Responsive breakpoint hooks
export {
  useBreakpoint,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsAbove,
  useIsBelow,
  BREAKPOINTS,
  type BreakpointKey,
  type BreakpointState,
} from './useBreakpoint';