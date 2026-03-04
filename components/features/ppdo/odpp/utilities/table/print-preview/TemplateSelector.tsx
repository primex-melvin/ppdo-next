'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalFooter,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
} from '@/components/ui/resizable-modal';
import {
  Check,
  X,
  Trash2,
  Copy,
  FileText,
  SquarePen,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';
import { useTemplateStorage } from '@/app/(extra)/canvas/_components/editor/hooks/useTemplateStorage';
import { toast } from 'sonner';
import { PageOrientationTab } from './PageOrientationTab';
import { CoverPageTab } from './CoverPageTab';
import { cn } from '@/lib/utils';

import TemplateCreator from '@/app/(extra)/canvas/_components/TemplateCreator';

type SetupStep = 'column-selection' | 'template' | 'orientation' | 'cover-page' | 'canvas-editor';

interface ColumnSelectionConfig {
  enabled: boolean;
  columns: Array<{
    key: string;
    label: string;
    required?: boolean;
  }>;
  maxColumns: number;
  initialSelectedKeys: string[];
  description?: string;
}

interface TemplateSelectorResult {
  template: CanvasTemplate | null;
  orientation: 'portrait' | 'landscape';
  includeCoverPage: boolean;
  selectedColumnKeys?: string[];
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: TemplateSelectorResult) => void;
  initialStep?: SetupStep;
  columnSelection?: ColumnSelectionConfig;
}

interface ColumnSelectionStepProps {
  columns: ColumnSelectionConfig['columns'];
  maxColumns: number;
  selectedKeys: Set<string>;
  description?: string;
  onToggle: (columnKey: string) => void;
  onContinue: () => void;
}

function ColumnSelectionStep({
  columns,
  maxColumns,
  selectedKeys,
  description,
  onToggle,
  onContinue,
}: ColumnSelectionStepProps) {
  const selectedCount = selectedKeys.size;
  const hasReachedLimit = selectedCount >= maxColumns;
  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, columnKey: string, disabled: boolean) => {
    if (disabled) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    onToggle(columnKey);
  };

  return (
    <>
      <ResizableModalHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <ResizableModalTitle className="text-xl">
              Select Print Columns
            </ResizableModalTitle>
            <ResizableModalDescription className="max-w-3xl leading-6">
              {description || 'This table has more than 12 visible columns. Print preview and exported PDF support up to 12 columns only. Select which columns to load into print preview.'}
            </ResizableModalDescription>
          </div>
          <Badge
            variant="outline"
            className="border-[#15803D]/25 bg-[#15803D]/10 px-3 py-1 text-[#166534] dark:border-[#22c55e]/30 dark:bg-[#14532d]/40 dark:text-[#86efac]"
          >
            {selectedCount} / {maxColumns} selected
          </Badge>
        </div>
      </ResizableModalHeader>

      <ResizableModalBody className="bg-gradient-to-b from-stone-50/80 via-white to-stone-50/40 px-6 py-6 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-start gap-3 text-sm text-stone-600 dark:text-zinc-300">
              <div className="mt-0.5 rounded-full bg-[#15803D]/10 p-2 text-[#15803D] dark:bg-[#14532d]/50 dark:text-[#86efac]">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-stone-900 dark:text-zinc-100">
                  More than 12 columns can overlap or become too narrow in the exported layout.
                </p>
                <p>
                  The first 12 visible page-table columns are already selected. You can adjust the selection before continuing.
                </p>
              </div>
            </div>
          </div>

          <div className="grid max-h-[460px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {columns.map((column, index) => {
              const isSelected = selectedKeys.has(column.key);
              const isDisabled = !isSelected && hasReachedLimit;

              return (
                <div
                  key={column.key}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => {
                    if (!isDisabled) {
                      onToggle(column.key);
                    }
                  }}
                  onKeyDown={(event) => handleCardKeyDown(event, column.key, isDisabled)}
                  className={cn(
                    'group flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-[#15803D]/30',
                    isSelected
                      ? 'border-[#15803D]/40 bg-[#15803D]/8 shadow-sm ring-1 ring-[#15803D]/15 dark:border-[#22c55e]/35 dark:bg-[#14532d]/25 dark:ring-[#22c55e]/10'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80',
                    isDisabled && 'cursor-not-allowed opacity-55 hover:border-stone-200 hover:bg-white dark:hover:border-zinc-800 dark:hover:bg-zinc-900'
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-sm font-semibold text-stone-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {index + 1}
                  </div>
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none data-[state=checked]:border-[#15803D] data-[state=checked]:bg-[#15803D] dark:data-[state=checked]:border-[#16a34a] dark:data-[state=checked]:bg-[#16a34a]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-stone-900 dark:text-zinc-100">
                        {column.label}
                      </span>
                      {column.required ? (
                        <Badge variant="outline" className="border-stone-300 text-[10px] uppercase tracking-wide text-stone-600 dark:border-zinc-700 dark:text-zinc-300">
                          Required
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                      {isSelected
                        ? 'Included in print preview'
                        : isDisabled
                          ? 'Unselect another column to choose this one'
                          : 'Available to include'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/90 px-4 py-3 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            {hasReachedLimit ? (
              <span className="font-medium text-[#166534] dark:text-[#86efac]">
                Maximum of {maxColumns} columns selected
              </span>
            ) : (
              <span>
                You can still select <span className="font-medium text-stone-900 dark:text-zinc-100">{maxColumns - selectedCount}</span> more column{maxColumns - selectedCount === 1 ? '' : 's'}.
              </span>
            )}
          </div>
        </div>
      </ResizableModalBody>

      <ResizableModalFooter className="sticky bottom-0 bg-white/95 backdrop-blur dark:bg-zinc-950/95">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-sm text-stone-500 dark:text-zinc-400">
            Selected columns will be used for both preview and exported PDF.
          </div>
          <Button
            onClick={onContinue}
            disabled={selectedCount === 0 || selectedCount > maxColumns}
            className="bg-[#15803D] px-6 text-white hover:bg-[#15803D]/90"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </ResizableModalFooter>
    </>
  );
}

export function TemplateSelector({
  isOpen,
  onClose,
  onComplete,
  initialStep = 'template',
  columnSelection,
}: TemplateSelectorProps) {
  const { templates, deleteTemplate, duplicateTemplate, refreshTemplates } = useTemplateStorage();

  const [step, setStep] = useState<SetupStep>(initialStep);
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(
    () => new Set(columnSelection?.initialSelectedKeys ?? [])
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      refreshTemplates();
      setStep(initialStep);
      setSelectedTemplate(null);
      setSelectedOrientation('landscape');
      setSelectedId(null);
      setSelectedColumnKeys(new Set(columnSelection?.initialSelectedKeys ?? []));
    }
  }, [isOpen, refreshTemplates, initialStep, columnSelection]);

  const handleToggleColumn = React.useCallback((columnKey: string) => {
    if (!columnSelection) return;

    const column = columnSelection.columns.find((item) => item.key === columnKey);
    if (column?.required) return;

    setSelectedColumnKeys((prev) => {
      const next = new Set(prev);

      if (next.has(columnKey)) {
        next.delete(columnKey);
        return next;
      }

      if (next.size >= columnSelection.maxColumns) {
        toast.error(`You can select up to ${columnSelection.maxColumns} columns only`);
        return prev;
      }

      next.add(columnKey);
      return next;
    });
  }, [columnSelection]);

  const handleColumnSelectionContinue = React.useCallback(() => {
    if (!columnSelection) {
      setStep('template');
      return;
    }

    if (selectedColumnKeys.size === 0) {
      toast.error('Select at least one column to continue');
      return;
    }

    if (selectedColumnKeys.size > columnSelection.maxColumns) {
      toast.error(`You can select up to ${columnSelection.maxColumns} columns only`);
      return;
    }

    setStep('template');
  }, [columnSelection, selectedColumnKeys]);

  const handleTemplateContinue = () => {
    const template = templates.find((item) => item.id === selectedId);
    if (!template) {
      toast.error('Please select a template first');
      return;
    }

    setSelectedTemplate(template);
    setStep('orientation');
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    setStep('orientation');
  };

  const handleOrientationSelected = (orientation: 'portrait' | 'landscape') => {
    setSelectedOrientation(orientation);
    setStep('cover-page');
  };

  const handleFinalize = (includeCoverPage: boolean) => {
    onComplete({
      template: selectedTemplate,
      orientation: selectedOrientation,
      includeCoverPage,
      selectedColumnKeys: Array.from(selectedColumnKeys),
    });
  };

  const handleDelete = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      deleteTemplate(templateId);
      if (selectedId === templateId) setSelectedId(null);
      toast.success('Template deleted');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      toast.error(message);
    }
  };

  const handleDuplicate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = duplicateTemplate(templateId);
      toast.success(`Template duplicated: ${duplicated.name}`);
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const handleCreateNew = () => {
    setStep('canvas-editor');
  };

  const handleEditorSaveSuccess = (template: CanvasTemplate) => {
    refreshTemplates();
    setSelectedTemplate(template);
    setStep('orientation');
  };

  const handleEditorBack = () => {
    refreshTemplates();
    setStep('template');
  };

  const getModalDimensions = () => {
    switch (step) {
      case 'canvas-editor':
        return { width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' };
      case 'template':
        return { width: '1200px', height: '800px', maxWidth: '95vw', maxHeight: '90vh' };
      case 'column-selection':
      case 'cover-page':
      case 'orientation':
      default:
        return { width: '860px', height: '640px', maxWidth: '95vw', maxHeight: '90vh' };
    }
  };

  const dimensions = getModalDimensions();

  return (
    <ResizableModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ResizableModalContent
        width={dimensions.width}
        height={dimensions.height}
        maxWidth={dimensions.maxWidth}
        maxHeight={dimensions.maxHeight}
        onCloseClick={onClose}
        preventOutsideClick={step === 'canvas-editor'}
        className={step === 'canvas-editor' ? 'overflow-hidden p-0' : ''}
      >
        {step === 'canvas-editor' ? (
          <TemplateCreator
            onBack={handleEditorBack}
            onClose={onClose}
            onSaveSuccess={handleEditorSaveSuccess}
            templateData={null}
          />
        ) : step === 'column-selection' ? (
          <ColumnSelectionStep
            columns={columnSelection?.columns || []}
            maxColumns={columnSelection?.maxColumns || 12}
            selectedKeys={selectedColumnKeys}
            description={columnSelection?.description}
            onToggle={handleToggleColumn}
            onContinue={handleColumnSelectionContinue}
          />
        ) : step === 'template' ? (
          <>
            <ResizableModalHeader>
              <div className="flex items-start gap-4">
                {columnSelection?.enabled ? (
                  <Button variant="ghost" size="icon" onClick={() => setStep('column-selection')} className="-ml-2">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                ) : null}
                <div>
                  <ResizableModalTitle className="text-xl">
                    Choose a Template
                  </ResizableModalTitle>
                  <ResizableModalDescription>
                    Select a template to apply headers, footers, and styling to all pages
                  </ResizableModalDescription>
                </div>
              </div>
            </ResizableModalHeader>

            <ResizableModalBody className="px-6 py-6">
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <button
                    onClick={handleCreateNew}
                    type="button"
                    className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-stone-300 transition-all hover:border-[#15803D] hover:bg-[#15803D]/5 dark:border-stone-600"
                  >
                    <div className="aspect-[8.5/11] flex flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#15803D]/10 transition-colors group-hover:bg-[#15803D]/20">
                        <SquarePen className="h-8 w-8 text-[#15803D]" />
                      </div>
                      <h4 className="mb-2 text-base font-semibold text-stone-900 dark:text-stone-100">Create New Template</h4>
                      <p className="text-sm leading-tight text-stone-500 dark:text-stone-400">Open canvas editor to design a custom template</p>
                    </div>
                  </button>

                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedId(template.id)}
                      onMouseEnter={() => setHoveredId(template.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        'group relative w-full cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
                        selectedId === template.id
                          ? 'border-[#15803D] shadow-lg ring-2 ring-[#15803D]/20'
                          : 'border-stone-200 hover:-translate-y-1 hover:border-stone-400 hover:shadow-md dark:border-stone-700 dark:hover:border-stone-500'
                      )}
                    >
                      <div className="relative aspect-[8.5/11] bg-stone-100 dark:bg-stone-800">
                        {template.thumbnail ? (
                          <Image
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 40vw, 90vw"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-stone-600">
                            <FileText className="h-12 w-12" />
                          </div>
                        )}
                        {hoveredId === template.id && !template.isDefault ? (
                          <div className="absolute right-3 top-3 z-10 flex gap-2">
                            <button type="button" onClick={(e) => handleDuplicate(template.id, e)} className="rounded-md bg-white p-2 shadow-lg transition-colors hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700">
                              <Copy className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                            </button>
                            <button type="button" onClick={(e) => handleDelete(template.id, e)} className="rounded-md bg-white p-2 shadow-lg transition-colors hover:bg-red-50 dark:bg-stone-800 dark:hover:bg-red-950">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {selectedId === template.id ? (
                        <div className="absolute left-3 top-3 z-10 rounded-full bg-[#15803D] p-1 text-white shadow-lg">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : null}
                      {template.isDefault ? (
                        <div className="absolute left-3 top-3 z-10 rounded bg-[#15803D] px-2 py-1 text-xs font-medium text-white">
                          Default
                        </div>
                      ) : null}
                      <div className="border-t border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800">
                        <h4 className="mb-1 truncate text-base font-semibold text-stone-900 dark:text-stone-100">{template.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                          <span className="capitalize">{template.page.orientation}</span>
                          {template.page.size ? (
                            <>
                              <span className="text-stone-300 dark:text-stone-600">•</span>
                              <span>{template.page.size}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#15803D]/10">
                    <FileText className="h-10 w-10 text-[#15803D]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100">No templates available</h3>
                  <p className="mb-6 text-stone-500 dark:text-stone-400">Create your first template to get started with custom designs</p>
                  <Button onClick={handleCreateNew} className="bg-[#15803D] hover:bg-[#15803D]/90">
                    <SquarePen className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                </div>
              )}
            </ResizableModalBody>

            <ResizableModalFooter className="bg-stone-50 px-6 py-4 dark:bg-stone-800/50">
              <Button variant="ghost" onClick={handleSkipTemplate} type="button" className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
                <X className="mr-2 h-4 w-4" />
                Skip - Start Blank
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {selectedId ? templates.find((item) => item.id === selectedId)?.name : 'No template selected'}
                </span>
                <Button onClick={handleTemplateContinue} disabled={!selectedId} type="button" className="bg-[#15803D] hover:bg-[#15803D]/90 disabled:bg-stone-300 disabled:text-stone-500">
                  <Check className="mr-2 h-4 w-4" />
                  Continue to Orientation
                </Button>
              </div>
            </ResizableModalFooter>
          </>
        ) : step === 'orientation' ? (
          <PageOrientationTab
            onBack={() => setStep('template')}
            onSelectOrientation={handleOrientationSelected}
            defaultOrientation={selectedTemplate?.page.orientation || 'landscape'}
          />
        ) : (
          <CoverPageTab
            onBack={() => setStep('orientation')}
            onSelect={handleFinalize}
          />
        )}
      </ResizableModalContent>
    </ResizableModal>
  );
}
