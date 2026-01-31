"use client";

import React, { useState, useCallback } from "react";
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalFooter,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Database } from "lucide-react";

export interface MigrationInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (sourceId: string, targetId: string) => void;
  isLoading?: boolean;
}

// Convex ID format validation (alphanumeric string typically 32 chars)
const CONVEX_ID_REGEX = /^[a-z0-9]+$/;

export function MigrationInputModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: MigrationInputModalProps) {
  const [sourceId, setSourceId] = useState("k57eavzkpm7yrjzsc3bp4302dx7z6ygj");
  const [targetId, setTargetId] = useState("");
  const [errors, setErrors] = useState<{ sourceId?: string; targetId?: string }>({});

  const validateId = (id: string): boolean => {
    if (!id.trim()) return false;
    if (id.length < 10) return false;
    return CONVEX_ID_REGEX.test(id);
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: { sourceId?: string; targetId?: string } = {};

    if (!sourceId.trim()) {
      newErrors.sourceId = "Source Budget Item ID is required";
    } else if (!validateId(sourceId)) {
      newErrors.sourceId = "Invalid Convex ID format";
    }

    if (!targetId.trim()) {
      newErrors.targetId = "Target 20% DF ID is required";
    } else if (!validateId(targetId)) {
      newErrors.targetId = "Invalid Convex ID format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sourceId, targetId]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit(sourceId.trim(), targetId.trim());
    }
  }, [validateForm, onSubmit, sourceId, targetId]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setErrors({});
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <ResizableModal open={open} onOpenChange={handleClose}>
      <ResizableModalContent
        width={480}
        maxWidth="95vw"
        preventOutsideClick={isLoading}
      >
        <ResizableModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <ResizableModalTitle>Migrate Budget Data to 20% DF</ResizableModalTitle>
              <ResizableModalDescription>
                Temporary migration tool for transferring budget data
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-5 space-y-5">
          {/* Description Banner */}
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This tool will migrate all projects and breakdowns from the source budget item
              to the target 20% Development Fund. This action cannot be undone.
            </p>
          </div>

          {/* Source Budget Item ID */}
          <div className="space-y-2">
            <Label
              htmlFor="sourceId"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Source Budget Item ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sourceId"
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                if (errors.sourceId) {
                  setErrors((prev) => ({ ...prev, sourceId: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter source budget item ID"
              disabled={isLoading}
              className={`bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 ${
                errors.sourceId
                  ? "border-red-500 focus-visible:ring-red-500/30"
                  : ""
              }`}
            />
            {errors.sourceId && (
              <p className="text-sm text-red-500">{errors.sourceId}</p>
            )}
          </div>

          {/* Target 20% DF ID */}
          <div className="space-y-2">
            <Label
              htmlFor="targetId"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Target 20% DF ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="targetId"
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                if (errors.targetId) {
                  setErrors((prev) => ({ ...prev, targetId: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter target twentyPercentDF ID"
              disabled={isLoading}
              className={`bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 ${
                errors.targetId
                  ? "border-red-500 focus-visible:ring-red-500/30"
                  : ""
              }`}
            />
            {errors.targetId && (
              <p className="text-sm text-red-500">{errors.targetId}</p>
            )}
          </div>
        </ResizableModalBody>

        <ResizableModalFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[#15803D] text-white hover:bg-[#15803D]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Preview Migration
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
