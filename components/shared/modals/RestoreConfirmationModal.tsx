// components/modals/RestoreConfirmationModal.tsx

"use client";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RotateCcw,
  Building2,
  Folder,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
} from "lucide-react";

interface RestoreConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  previewData: {
    targetItem: {
      id: string;
      name: string;
      type: "budgetItem" | "project" | "breakdown";
    };
    cascadeRestoreCounts: {
      projects: number;
      breakdowns: number;
    };
    parentStatus: {
      parentId?: string;
      parentName?: string;
      parentType?: "budgetItem" | "project";
      isParentDeleted: boolean;
    };
    warnings: string[];
    canRestore: boolean;
  } | null;
  isLoading: boolean;
}

const typeConfig = {
  budgetItem: {
    icon: Building2,
    label: "Budget Item",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  project: {
    icon: Folder,
    label: "Project",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  breakdown: {
    icon: FileText,
    label: "Breakdown",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
};

export function RestoreConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  previewData,
  isLoading,
}: RestoreConfirmationModalProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const getTypeIcon = (type: "budgetItem" | "project" | "breakdown") => {
    const Icon = typeConfig[type].icon;
    return (
      <div
        className={`w-10 h-10 rounded-lg ${typeConfig[type].bgColor} flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${typeConfig[type].color}`} />
      </div>
    );
  };

  const getParentTypeLabel = (
    type?: "budgetItem" | "project"
  ) => {
    if (!type) return "Parent";
    return typeConfig[type].label;
  };

  return (
    <ResizableModal open={open} onOpenChange={onOpenChange}>
      <ResizableModalContent width={480} maxHeight="90vh">
        <ResizableModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <ResizableModalTitle>Restore from Trash</ResizableModalTitle>
              <ResizableModalDescription>
                Review items to be restored
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm text-stone-500">
                Checking restore requirements...
              </p>
            </div>
          ) : previewData ? (
            <>
              {/* Target Item Card */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                {getTypeIcon(previewData.targetItem.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {previewData.targetItem.name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      typeConfig[previewData.targetItem.type].bgColor
                    } ${typeConfig[previewData.targetItem.type].color}`}
                  >
                    {typeConfig[previewData.targetItem.type].label}
                  </span>
                </div>
              </div>

              {/* Cascade Restore Summary */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-stone-500" />
                  <h4 className="font-medium text-stone-900 dark:text-stone-100">
                    Items to Restore
                  </h4>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-stone-600 dark:text-stone-400">
                      This item
                    </span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      1
                    </span>
                  </li>
                  {previewData.cascadeRestoreCounts.projects > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="text-stone-600 dark:text-stone-400">
                        Projects
                      </span>
                      <span className="font-medium text-emerald-600">
                        {previewData.cascadeRestoreCounts.projects}
                      </span>
                    </li>
                  )}
                  {previewData.cascadeRestoreCounts.breakdowns > 0 && (
                    <li className="flex items-center justify-between">
                      <span className="text-stone-600 dark:text-stone-400">
                        Breakdowns
                      </span>
                      <span className="font-medium text-emerald-600">
                        {previewData.cascadeRestoreCounts.breakdowns}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Parent Status Section */}
              {previewData.parentStatus.isParentDeleted ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      PARENT ITEM DELETED
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-stone-700 dark:text-stone-300">
                      This {typeConfig[previewData.targetItem.type].label.toLowerCase()} belongs to:
                    </p>
                    {previewData.parentStatus.parentName && (
                      <p className="text-stone-600 dark:text-stone-400">
                        <span className="font-medium">
                          {getParentTypeLabel(previewData.parentStatus.parentType)}:
                        </span>{" "}
                        {previewData.parentStatus.parentName}
                      </p>
                    )}
                    <p className="text-red-600 font-medium">
                      Status: DELETED
                    </p>
                    <p className="text-stone-600 dark:text-stone-400 mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      Restoring this item will make it{" "}
                      <strong>orphaned</strong> (no parent).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                      Parent Status: ACTIVE
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {previewData.parentStatus.parentName ? (
                      <>
                        <p className="text-stone-600 dark:text-stone-400">
                          <span className="font-medium">Parent:</span>{" "}
                          {previewData.parentStatus.parentName}
                        </p>
                        <p className="text-stone-600 dark:text-stone-400">
                          This item will be restored under its original parent.
                        </p>
                      </>
                    ) : (
                      <p className="text-stone-600 dark:text-stone-400">
                        This is a root-level item with no parent.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings Section */}
              {previewData.warnings.length > 0 && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <ul className="space-y-1 mt-1">
                      {previewData.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Cannot Restore Message */}
              {!previewData.canRestore && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    This item cannot be restored due to the issues listed above.
                    Please resolve them first.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </ResizableModalBody>

        <ResizableModalFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !previewData?.canRestore}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </>
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
