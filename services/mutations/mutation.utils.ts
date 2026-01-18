// services/mutations/mutation.utils.ts
// NEW FILE - CREATE THIS

import { toast } from "sonner";

/**
 * Standard mutation response interface
 */
export interface MutationResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
}

/**
 * Handles mutation response and shows appropriate toast notifications
 * 
 * @param response - Mutation response object
 * @param successMessage - Optional custom success message
 * @param errorMessage - Optional custom error message
 * @returns Boolean indicating success
 * 
 * @example
 * ```typescript
 * const response = await createBudgetItem({ ... });
 * const success = handleMutationResponse(response, "Budget item created!");
 * ```
 */
export function handleMutationResponse<T>(
  response: MutationResponse<T>,
  successMessage?: string,
  errorMessage?: string
): boolean {
  if (response.success) {
    const message = successMessage || response.message || "Operation successful";
    toast.success(message, {
      description: (response.data as any)?.details || undefined,
    });
    return true;
  } else {
    const message = errorMessage || response.error?.message || "Operation failed";
    toast.error(message, {
      description: response.error?.details 
        ? JSON.stringify(response.error.details) 
        : undefined,
    });
    return false;
  }
}

/**
 * Wraps a mutation call with error handling and loading state
 * 
 * @param mutationFn - Async mutation function
 * @param options - Configuration options
 * @returns Promise with mutation result
 * 
 * @example
 * ```typescript
 * await withMutationHandling(
 *   () => createBudgetItem({ particulars: "GAD", ... }),
 *   {
 *     loadingMessage: "Creating budget item...",
 *     successMessage: "Budget item created!",
 *     errorMessage: "Failed to create budget item",
 *   }
 * );
 * ```
 */
export async function withMutationHandling<T>(
  mutationFn: () => Promise<MutationResponse<T>>,
  options?: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  }
): Promise<boolean> {
  let toastId: string | number | undefined;

  try {
    // Show loading toast if message provided
    if (options?.loadingMessage) {
      toastId = toast.loading(options.loadingMessage);
    }

    // Execute mutation
    const response = await mutationFn();

    // Dismiss loading toast
    if (toastId) {
      toast.dismiss(toastId);
    }

    // Handle response
    const success = handleMutationResponse(
      response,
      options?.successMessage,
      options?.errorMessage
    );

    // Execute success callback
    if (success && response.data && options?.onSuccess) {
      options.onSuccess(response.data);
    }

    // Execute error callback
    if (!success && options?.onError) {
      options.onError(response.error);
    }

    return success;
  } catch (error) {
    // Dismiss loading toast
    if (toastId) {
      toast.dismiss(toastId);
    }

    // Handle unexpected errors
    const message = options?.errorMessage || "An unexpected error occurred";
    toast.error(message, {
      description: error instanceof Error ? error.message : "Please try again.",
    });

    if (options?.onError) {
      options.onError(error);
    }

    return false;
  }
}

/**
 * Creates a standardized error response
 * 
 * @param message - Error message
 * @param code - Optional error code
 * @param details - Optional error details
 * @returns MutationResponse error object
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: Record<string, any>
): MutationResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

/**
 * Creates a standardized success response
 * 
 * @param data - Response data
 * @param message - Optional success message
 * @returns MutationResponse success object
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): MutationResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Validates mutation response structure
 * 
 * @param response - Response to validate
 * @returns Boolean indicating if response is valid
 */
export function isValidMutationResponse(response: any): response is MutationResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof response.success === 'boolean'
  );
}

/**
 * Extracts error message from mutation response
 * 
 * @param response - Mutation response
 * @param fallback - Fallback message if none found
 * @returns Error message string
 */
export function extractErrorMessage(
  response: MutationResponse,
  fallback: string = "Operation failed"
): string {
  return response.error?.message || fallback;
}

/**
 * Extracts success data from mutation response
 * 
 * @param response - Mutation response
 * @returns Data if successful, undefined otherwise
 */
export function extractSuccessData<T>(
  response: MutationResponse<T>
): T | undefined {
  return response.success ? response.data : undefined;
}