// lib/shared/hooks/useFeatureActions.ts

"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import {
  executeMutation,
  executeMutationCreate,
  executeMutationUpdate,
  executeMutationDelete,
  type MutationOptions,
} from "@/lib/shared/utils/mutation-wrapper";

/**
 * Base configuration for feature actions
 */
export interface FeatureActionConfig<T = unknown> {
  /** Callback fired when action succeeds */
  onSuccess?: (data?: T) => void;
  /** Callback fired when action fails */
  onError?: (error: Error) => void;
  /** Entity name for toast messages (e.g., "budget item", "project") */
  entityName?: string;
  /** Whether to suppress toast notifications */
  silent?: boolean;
}

/**
 * Return type for individual action
 */
export interface FeatureAction<TArgs = any, TResult = any> {
  /** Execute the action */
  execute: (args: TArgs) => Promise<TResult>;
  /** Whether the action is currently pending */
  isPending: boolean;
}

/**
 * Return type for CRUD actions hook
 */
export interface FeatureActions<
  TCreateArgs = any,
  TUpdateArgs = any,
  TDeleteArgs = any,
  TResult = any
> {
  create: FeatureAction<TCreateArgs, TResult>;
  update: FeatureAction<TUpdateArgs, TResult>;
  delete: FeatureAction<TDeleteArgs, TResult>;
  /** True if any action is pending */
  isAnyPending: boolean;
}

/**
 * Hook for handling CREATE operations with automatic lifecycle management
 *
 * @example
 * ```tsx
 * const createAction = useCreateAction(api.budgetItems.create, {
 *   entityName: "budget item",
 *   onSuccess: () => closeModal(),
 * });
 *
 * const handleSubmit = async (data) => {
 *   await createAction.execute(data);
 * };
 * ```
 */
export function useCreateAction<TArgs = any, TResult = any>(
  mutation: FunctionReference<"mutation">,
  config: FeatureActionConfig<TResult> = {}
): FeatureAction<TArgs, TResult> {
  const mutate = useMutation(mutation);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsPending(true);
      try {
        const result = await executeMutationCreate<TResult>(
          mutate(args as any),
          config.entityName || "item",
          {
            onSuccess: config.onSuccess,
            onError: config.onError,
            silent: config.silent,
          }
        );
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [mutate, config]
  );

  return { execute, isPending };
}

/**
 * Hook for handling UPDATE operations with automatic lifecycle management
 *
 * @example
 * ```tsx
 * const updateAction = useUpdateAction(api.budgetItems.update, {
 *   entityName: "budget item",
 *   onSuccess: () => closeModal(),
 * });
 *
 * const handleSubmit = async (data) => {
 *   await updateAction.execute({ id, ...data });
 * };
 * ```
 */
export function useUpdateAction<TArgs = any, TResult = any>(
  mutation: FunctionReference<"mutation">,
  config: FeatureActionConfig<TResult> = {}
): FeatureAction<TArgs, TResult> {
  const mutate = useMutation(mutation);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsPending(true);
      try {
        const result = await executeMutationUpdate<TResult>(
          mutate(args as any),
          config.entityName || "item",
          {
            onSuccess: config.onSuccess,
            onError: config.onError,
            silent: config.silent,
          }
        );
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [mutate, config]
  );

  return { execute, isPending };
}

/**
 * Hook for handling DELETE operations with automatic lifecycle management
 *
 * @example
 * ```tsx
 * const deleteAction = useDeleteAction(api.budgetItems.remove, {
 *   onSuccess: () => console.log("Deleted successfully"),
 * });
 *
 * const handleDelete = async (id: string) => {
 *   await deleteAction.execute({ id });
 * };
 * ```
 */
export function useDeleteAction<TArgs = any, TResult = any>(
  mutation: FunctionReference<"mutation">,
  config: FeatureActionConfig<TResult> = {}
): FeatureAction<TArgs, TResult> {
  const mutate = useMutation(mutation);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsPending(true);
      try {
        const result = await executeMutationDelete<TResult>(
          mutate(args as any),
          {
            onSuccess: config.onSuccess,
            onError: config.onError,
            silent: config.silent,
          }
        );
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [mutate, config]
  );

  return { execute, isPending };
}

/**
 * Factory hook that creates a unified interface for Create/Update/Delete operations
 *
 * Eliminates repetitive mutation handling by:
 * - Managing loading states automatically
 * - Handling success/error notifications via mutation-wrapper
 * - Providing consistent lifecycle callbacks
 * - Supporting modal close on success pattern
 *
 * @example
 * ```tsx
 * const actions = useFeatureActions({
 *   create: api.projects.create,
 *   update: api.projects.update,
 *   delete: api.projects.remove,
 *   entityName: "project",
 *   onSuccess: () => closeModal(),
 * });
 *
 * // In your form
 * const handleSubmit = async (data) => {
 *   if (isEditMode) {
 *     await actions.update.execute({ id, ...data });
 *   } else {
 *     await actions.create.execute(data);
 *   }
 * };
 *
 * // In your delete handler
 * const handleDelete = async () => {
 *   await actions.delete.execute({ id });
 * };
 * ```
 */
export function useFeatureActions<
  TCreateArgs = any,
  TUpdateArgs = any,
  TDeleteArgs = any,
  TResult = any
>(config: {
  create?: FunctionReference<"mutation">;
  update?: FunctionReference<"mutation">;
  delete?: FunctionReference<"mutation">;
  entityName?: string;
  onSuccess?: (data?: TResult) => void;
  onError?: (error: Error) => void;
  silent?: boolean;
}): FeatureActions<TCreateArgs, TUpdateArgs, TDeleteArgs, TResult> {
  const baseConfig: FeatureActionConfig<TResult> = {
    entityName: config.entityName,
    onSuccess: config.onSuccess,
    onError: config.onError,
    silent: config.silent,
  };

  const createMutation = config.create ? useMutation(config.create) : null;
  const updateMutation = config.update ? useMutation(config.update) : null;
  const deleteMutation = config.delete ? useMutation(config.delete) : null;

  const [createPending, setCreatePending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const create = useCallback(
    async (args: TCreateArgs): Promise<TResult> => {
      if (!createMutation) {
        throw new Error("Create mutation not configured");
      }
      setCreatePending(true);
      try {
        const result = await executeMutationCreate<TResult>(
          createMutation(args as any),
          baseConfig.entityName || "item",
          {
            onSuccess: baseConfig.onSuccess,
            onError: baseConfig.onError,
            silent: baseConfig.silent,
          }
        );
        return result;
      } finally {
        setCreatePending(false);
      }
    },
    [createMutation, baseConfig]
  );

  const update = useCallback(
    async (args: TUpdateArgs): Promise<TResult> => {
      if (!updateMutation) {
        throw new Error("Update mutation not configured");
      }
      setUpdatePending(true);
      try {
        const result = await executeMutationUpdate<TResult>(
          updateMutation(args as any),
          baseConfig.entityName || "item",
          {
            onSuccess: baseConfig.onSuccess,
            onError: baseConfig.onError,
            silent: baseConfig.silent,
          }
        );
        return result;
      } finally {
        setUpdatePending(false);
      }
    },
    [updateMutation, baseConfig]
  );

  const deleteAction = useCallback(
    async (args: TDeleteArgs): Promise<TResult> => {
      if (!deleteMutation) {
        throw new Error("Delete mutation not configured");
      }
      setDeletePending(true);
      try {
        const result = await executeMutationDelete<TResult>(
          deleteMutation(args as any),
          {
            onSuccess: baseConfig.onSuccess,
            onError: baseConfig.onError,
            silent: baseConfig.silent,
          }
        );
        return result;
      } finally {
        setDeletePending(false);
      }
    },
    [deleteMutation, baseConfig]
  );

  return {
    create: { execute: create, isPending: createPending },
    update: { execute: update, isPending: updatePending },
    delete: { execute: deleteAction, isPending: deletePending },
    isAnyPending: createPending || updatePending || deletePending,
  };
}

/**
 * Generic action hook for custom operations
 *
 * @example
 * ```tsx
 * const toggleAction = useAction(api.budgetItems.toggleAutoCalculate, {
 *   onSuccess: () => console.log("Toggled!"),
 * });
 *
 * await toggleAction.execute({ id, value: true });
 * ```
 */
export function useAction<TArgs = any, TResult = any>(
  mutation: FunctionReference<"mutation">,
  config: FeatureActionConfig<TResult> & {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): FeatureAction<TArgs, TResult> {
  const mutate = useMutation(mutation);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsPending(true);
      try {
        const result = await executeMutation<TResult>(mutate(args as any), {
          loadingMessage: config.loadingMessage,
          successMessage: config.successMessage,
          errorMessage: config.errorMessage,
          onSuccess: config.onSuccess,
          onError: config.onError,
          silent: config.silent,
        });
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [mutate, config]
  );

  return { execute, isPending };
}
