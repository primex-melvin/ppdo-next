// components/shared/modals/ControlledModal.tsx

"use client";

import React from "react";
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
  ResizableModalFooter,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";

/**
 * Props for ControlledModal component
 */
export interface ControlledModalProps {
  // Modal state
  isOpen: boolean;
  onClose: () => void;

  // Content
  title: string;
  description?: string;
  children: React.ReactNode;

  // Footer actions
  footer?: React.ReactNode;
  showDefaultFooter?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;

  // Modal configuration
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  allowOverflow?: boolean;
  preventOutsideClick?: boolean;

  // Additional props
  className?: string;
}

/**
 * Controlled modal wrapper that simplifies ResizableModal usage
 *
 * Automatically includes:
 * - ResizableModalOverlay (via ResizableModalContent)
 * - Consistent header structure
 * - Optional default footer with submit/cancel buttons
 * - Proper state management integration
 *
 * @example
 * // With default footer:
 * const modal = useModal<Breakdown>();
 *
 * <ControlledModal
 *   isOpen={modal.isOpen}
 *   onClose={modal.closeModal}
 *   title="Create Breakdown"
 *   description="Fill in the details below"
 *   showDefaultFooter
 *   submitLabel="Create"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isLoading}
 * >
 *   <form>...</form>
 * </ControlledModal>
 *
 * @example
 * // With custom footer:
 * <ControlledModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Confirm Action"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={onClose}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </div>
 *   }
 * >
 *   <p>Are you sure?</p>
 * </ControlledModal>
 */
export function ControlledModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  showDefaultFooter = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onSubmit,
  isSubmitting = false,
  width = "600px",
  height = "auto",
  maxWidth = "95vw",
  maxHeight = "90vh",
  allowOverflow = false,
  preventOutsideClick = false,
  className,
}: ControlledModalProps) {
  // Default footer component
  const defaultFooter = showDefaultFooter && (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );

  return (
    <ResizableModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResizableModalContent
        width={width}
        height={height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        allowOverflow={allowOverflow}
        preventOutsideClick={preventOutsideClick}
        onCloseClick={onClose}
        className={className}
      >
        <ResizableModalHeader>
          <ResizableModalTitle>{title}</ResizableModalTitle>
          {description && (
            <ResizableModalDescription>{description}</ResizableModalDescription>
          )}
        </ResizableModalHeader>

        <ResizableModalBody>
          {children}
        </ResizableModalBody>

        {(footer || showDefaultFooter) && (
          <ResizableModalFooter>
            {footer || defaultFooter}
          </ResizableModalFooter>
        )}
      </ResizableModalContent>
    </ResizableModal>
  );
}

/**
 * Simplified modal wrapper for view-only content
 * No footer, just close button in header
 *
 * @example
 * <ViewModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Project Details"
 * >
 *   <div>...</div>
 * </ViewModal>
 */
export function ViewModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "800px",
  maxHeight = "90vh",
  allowOverflow = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string | number;
  maxHeight?: string | number;
  allowOverflow?: boolean;
}) {
  return (
    <ResizableModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResizableModalContent
        width={width}
        height="auto"
        maxWidth="95vw"
        maxHeight={maxHeight}
        allowOverflow={allowOverflow}
        onCloseClick={onClose}
      >
        <ResizableModalHeader>
          <ResizableModalTitle>{title}</ResizableModalTitle>
          {description && (
            <ResizableModalDescription>{description}</ResizableModalDescription>
          )}
        </ResizableModalHeader>

        <ResizableModalBody>
          {children}
        </ResizableModalBody>
      </ResizableModalContent>
    </ResizableModal>
  );
}

/**
 * Confirmation modal wrapper for delete/destructive actions
 *
 * @example
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Delete Project?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}) {
  return (
    <ResizableModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResizableModalContent
        width="450px"
        height="auto"
        maxHeight="90vh"
        preventOutsideClick={isLoading}
        onCloseClick={onClose}
      >
        <ResizableModalHeader>
          <ResizableModalTitle>{title}</ResizableModalTitle>
          {description && (
            <ResizableModalDescription>{description}</ResizableModalDescription>
          )}
        </ResizableModalHeader>

        <ResizableModalFooter>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
