// lib/shared/utils/mutation-wrapper.ts

import { toast } from "sonner";

/**
 * Standard mutation response type
 */
export type MutationResponse<T = unknown> =
  | {
      success: true;
      data?: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        message: string;
        code?: string;
      };
      message?: string;
    };

/**
 * Type guard to check if response follows MutationResponse pattern
 */
export function isMutationResponse(value: unknown): value is MutationResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as any).success === "boolean"
  );
}

/**
 * Configuration options for mutation execution
 */
export interface MutationOptions<T = unknown> {
  /** Message to show while mutation is loading */
  loadingMessage?: string;
  /** Message to show on success */
  successMessage?: string;
  /** Message to show on error (if not provided by server) */
  errorMessage?: string;
  /** Callback fired on success */
  onSuccess?: (data: T) => void;
  /** Callback fired on error */
  onError?: (error: Error) => void;
  /** Whether to suppress toast notifications */
  silent?: boolean;
}

/**
 * Standard action messages for common CRUD operations
 */
export const MUTATION_MESSAGES = {
  // Create operations
  CREATE: {
    loading: (entity: string) => `Creating ${entity}...`,
    success: (entity: string) => `${entity} created successfully`,
    error: (entity: string) => `Failed to create ${entity}`,
  },
  // Update operations
  UPDATE: {
    loading: (entity: string) => `Updating ${entity}...`,
    success: (entity: string) => `${entity} updated successfully`,
    error: (entity: string) => `Failed to update ${entity}`,
  },
  // Delete/Trash operations
  DELETE: {
    loading: "Moving to trash...",
    success: "Item moved to trash",
    error: "Failed to move item to trash",
  },
  // Restore operations
  RESTORE: {
    loading: "Restoring item...",
    success: "Item restored successfully",
    error: "Failed to restore item",
  },
  // Toggle/Status operations
  TOGGLE: {
    loading: "Updating status...",
    success: "Status updated successfully",
    error: "Failed to update status",
  },
  // Export operations
  EXPORT: {
    loading: "Exporting data...",
    success: "CSV exported successfully",
    error: "Failed to export CSV",
  },
} as const;

/**
 * Execute a mutation with automatic toast notifications and error handling
 *
 * Standardizes mutation handling across the application by:
 * - Showing loading toast during mutation
 * - Automatically handling success/error states
 * - Supporting both direct returns and MutationResponse pattern
 * - Providing consistent error messages
 *
 * @example
 * ```tsx
 * // Using with predefined messages
 * const result = await executeMutation(
 *   createBudgetItem({ name: "..." }),
 *   MUTATION_MESSAGES.CREATE.loading("budget item"),
 *   MUTATION_MESSAGES.CREATE.success("Budget item"),
 *   MUTATION_MESSAGES.CREATE.error("budget item")
 * );
 *
 * // Using with options
 * const result = await executeMutation(
 *   updateProject({ id, data }),
 *   {
 *     loadingMessage: "Saving changes...",
 *     successMessage: "Project saved!",
 *     onSuccess: (data) => console.log("Success:", data)
 *   }
 * );
 * ```
 *
 * @param mutationPromise - The mutation promise to execute
 * @param loadingMessageOrOptions - Loading message string OR options object
 * @param successMessage - Message to show on success (ignored if options used)
 * @param errorMessage - Message to show on error (ignored if options used)
 * @returns The mutation result data
 * @throws Error if mutation fails
 */
export async function executeMutation<T = unknown>(
  mutationPromise: Promise<T>,
  loadingMessageOrOptions?: string | MutationOptions<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<T> {
  // Parse options
  const options: MutationOptions<T> =
    typeof loadingMessageOrOptions === "string"
      ? {
          loadingMessage: loadingMessageOrOptions,
          successMessage,
          errorMessage,
        }
      : loadingMessageOrOptions || {};

  const {
    loadingMessage = "Processing...",
    successMessage: successMsg = "Operation completed successfully",
    errorMessage: errorMsg = "Operation failed",
    onSuccess,
    onError,
    silent = false,
  } = options;

  let toastId: string | number | undefined;

  try {
    // Show loading toast
    if (!silent) {
      toastId = toast.loading(loadingMessage);
    }

    // Execute mutation
    const response = await mutationPromise;

    // Dismiss loading toast
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    }

    // Handle MutationResponse pattern
    if (isMutationResponse(response)) {
      if (response.success) {
        if (!silent) {
          toast.success(response.message || successMsg);
        }
        if (onSuccess) {
          onSuccess(response.data as T);
        }
        return response.data as T;
      } else {
        const error = new Error(response.error.message || errorMsg);
        if (!silent) {
          toast.error(response.error.message || errorMsg);
        }
        if (onError) {
          onError(error);
        }
        throw error;
      }
    }

    // Handle direct return
    if (!silent) {
      toast.success(successMsg);
    }
    if (onSuccess) {
      onSuccess(response);
    }
    return response;
  } catch (error) {
    // Dismiss loading toast on error
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    }

    console.error("Mutation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : errorMsg || "An error occurred";

    if (!silent) {
      toast.error(errorMessage);
    }

    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage));
    }

    throw error;
  }
}

/**
 * Helper for CREATE operations with standardized messages
 */
export function executeMutationCreate<T = unknown>(
  mutationPromise: Promise<T>,
  entityName: string,
  options?: Omit<
    MutationOptions<T>,
    "loadingMessage" | "successMessage" | "errorMessage"
  >
): Promise<T> {
  return executeMutation(mutationPromise, {
    ...options,
    loadingMessage: MUTATION_MESSAGES.CREATE.loading(entityName),
    successMessage: MUTATION_MESSAGES.CREATE.success(
      entityName.charAt(0).toUpperCase() + entityName.slice(1)
    ),
    errorMessage: MUTATION_MESSAGES.CREATE.error(entityName),
  });
}

/**
 * Helper for UPDATE operations with standardized messages
 */
export function executeMutationUpdate<T = unknown>(
  mutationPromise: Promise<T>,
  entityName: string,
  options?: Omit<
    MutationOptions<T>,
    "loadingMessage" | "successMessage" | "errorMessage"
  >
): Promise<T> {
  return executeMutation(mutationPromise, {
    ...options,
    loadingMessage: MUTATION_MESSAGES.UPDATE.loading(entityName),
    successMessage: MUTATION_MESSAGES.UPDATE.success(
      entityName.charAt(0).toUpperCase() + entityName.slice(1)
    ),
    errorMessage: MUTATION_MESSAGES.UPDATE.error(entityName),
  });
}

/**
 * Helper for DELETE operations with standardized messages
 */
export function executeMutationDelete<T = unknown>(
  mutationPromise: Promise<T>,
  options?: Omit<
    MutationOptions<T>,
    "loadingMessage" | "successMessage" | "errorMessage"
  >
): Promise<T> {
  return executeMutation(mutationPromise, {
    ...options,
    loadingMessage: MUTATION_MESSAGES.DELETE.loading,
    successMessage: MUTATION_MESSAGES.DELETE.success,
    errorMessage: MUTATION_MESSAGES.DELETE.error,
  });
}
