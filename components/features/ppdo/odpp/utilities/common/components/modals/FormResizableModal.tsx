"use client";

import { ReactNode } from "react";
import {
  ResizableModal,
  ResizableModalBody,
  ResizableModalContent,
  ResizableModalDescription,
  ResizableModalHeader,
  ResizableModalTitle,
} from "@/components/ui/resizable-modal";

type ModalSize = "sm" | "md" | "lg" | "xl";

export interface FormResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: ModalSize;
}

const SIZE_WIDTH_MAP: Record<ModalSize, string> = {
  sm: "28rem",
  md: "32rem",
  lg: "42rem",
  xl: "56rem",
};

export function FormResizableModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: FormResizableModalProps) {
  if (!isOpen) return null;

  return (
    <ResizableModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ResizableModalContent
        width={SIZE_WIDTH_MAP[size]}
        maxWidth="calc(100vw - 2rem)"
        maxHeight="90vh"
        onCloseClick={onClose}
        className="w-full flex flex-col max-sm:w-full max-sm:h-auto max-sm:max-w-[calc(100vw-2rem)] max-sm:max-h-[90vh] max-sm:rounded-xl"
      >
        <ResizableModalHeader className="p-4 sm:p-6">
          <ResizableModalTitle className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </ResizableModalTitle>
          {subtitle && (
            <ResizableModalDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {subtitle}
            </ResizableModalDescription>
          )}
        </ResizableModalHeader>
        <ResizableModalBody className="p-4 sm:p-6">{children}</ResizableModalBody>
      </ResizableModalContent>
    </ResizableModal>
  );
}
