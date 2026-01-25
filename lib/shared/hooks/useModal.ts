// lib/shared/hooks/useModal.ts

import { useState, useCallback } from "react";

/**
 * Generic modal state and data type
 */
export interface ModalState<T = any> {
  isOpen: boolean;
  data: T | null;
  mode: "create" | "edit" | "view";
}

/**
 * Hook return type
 */
export interface UseModalReturn<T = any> {
  isOpen: boolean;
  data: T | null;
  mode: "create" | "edit" | "view";
  openModal: () => void;
  openCreateModal: () => void;
  openEditModal: (data: T) => void;
  openViewModal: (data: T) => void;
  closeModal: () => void;
  setData: (data: T | null) => void;
}

/**
 * Unified modal state management hook
 *
 * Reduces boilerplate for modal state management by providing:
 * - Open/close handlers
 * - Data management for edit/view modes
 * - Mode tracking (create/edit/view)
 *
 * @example
 * // Basic usage:
 * const modal = useModal<Breakdown>();
 *
 * // Open for creating:
 * <button onClick={modal.openCreateModal}>Add New</button>
 *
 * // Open for editing:
 * <button onClick={() => modal.openEditModal(breakdown)}>Edit</button>
 *
 * // In modal component:
 * <ResizableModal open={modal.isOpen} onOpenChange={(open) => !open && modal.closeModal()}>
 *   {modal.mode === "edit" && modal.data && (
 *     <form>...</form>
 *   )}
 * </ResizableModal>
 */
export function useModal<T = any>(initialData: T | null = null): UseModalReturn<T> {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: false,
    data: initialData,
    mode: "create",
  });

  const openModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const openCreateModal = useCallback(() => {
    setState({
      isOpen: true,
      data: null,
      mode: "create",
    });
  }, []);

  const openEditModal = useCallback((data: T) => {
    setState({
      isOpen: true,
      data,
      mode: "edit",
    });
  }, []);

  const openViewModal = useCallback((data: T) => {
    setState({
      isOpen: true,
      data,
      mode: "view",
    });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    mode: state.mode,
    openModal,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    setData,
  };
}

/**
 * Simplified modal hook for basic open/close without data management
 * Use this when you don't need edit/view modes or data tracking
 *
 * @example
 * const { isOpen, open, close } = useSimpleModal();
 *
 * <button onClick={open}>Open Modal</button>
 * <ResizableModal open={isOpen} onOpenChange={(open) => !open && close()}>
 *   ...
 * </ResizableModal>
 */
export function useSimpleModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
