// components/ppdo/table/print-preview/PrintPreviewToolbar.tsx

"use client";

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Save, Palette, Ruler, MoreVertical, Square } from 'lucide-react';
import { DocumentTitleEditor } from './DocumentTitleEditor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MarginDropdown } from '@/app/(extra)/canvas/_components/editor/margin-dropdown';
import { JustifyDropdown, TextAlign } from './JustifyDropdown';
import { TableFontSizeDropdown } from './TableFontSizeDropdown';
import { PageSizeDropdown } from './PageSizeDropdown';

interface PrintPreviewToolbarProps {
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedTime: string;
  onBack: () => void;
  onClose: () => void;
  onSaveDraft?: () => void;
  onApplyTemplate?: () => void;
  isEditorMode: boolean;
  onEditorModeChange: (enabled: boolean) => void;
  rulerVisible?: boolean;
  onToggleRuler?: () => void;
  marginGuidesVisible?: boolean;
  onToggleMarginGuides?: () => void;
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Short' | 'Long';
  onPageSizeChange?: (size: 'A4' | 'Short' | 'Long') => void;
  currentMargin?: number;
  onMarginChange?: (value: number) => void;
  textAlign?: TextAlign;
  onTextAlignChange?: (align: TextAlign) => void;
  tableFontSize?: number;
  onTableFontSizeChange?: (fontSize: number) => void;
  showPageHeader?: boolean;
  onShowPageHeaderChange?: (enabled: boolean) => void;
  showPageFooter?: boolean;
  onShowPageFooterChange?: (enabled: boolean) => void;
  footerPageLabelPosition?: 'left' | 'right';
  onFooterPageLabelPositionChange?: (position: 'left' | 'right') => void;
}


export function PrintPreviewToolbar({
  documentTitle,
  onTitleChange,
  isDirty,
  isSaving,
  lastSavedTime,
  onBack,
  onClose,
  onSaveDraft,
  onApplyTemplate,
  isEditorMode,
  onEditorModeChange,
  rulerVisible = false,
  onToggleRuler,
  marginGuidesVisible = false,
  onToggleMarginGuides,
  pageOrientation = 'portrait',
  pageSize = 'A4',
  onPageSizeChange,
  currentMargin,
  onMarginChange,
  textAlign,
  onTextAlignChange,
  tableFontSize,
  onTableFontSizeChange,
  showPageHeader = true,
  onShowPageHeaderChange,
  showPageFooter = true,
  onShowPageFooterChange,
  footerPageLabelPosition = 'left',
  onFooterPageLabelPositionChange,
}: PrintPreviewToolbarProps) {

  return (
    <div className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Back/Close */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="gap-2 px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to list</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 hidden xs:block" />

        <div className="flex flex-col min-w-0">
          <DocumentTitleEditor
            title={documentTitle}
            onTitleChange={onTitleChange}
            isEditorMode={isEditorMode}
            isDirty={isDirty}
          />
          {lastSavedTime && (
            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Unsaved changes
                </span>
              ) : (
                `Saved ${lastSavedTime}`
              )}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Editor Mode Toggle - Always visible on larger screens, collapsed on tiny ones? 
            Actually, editor mode is quite important. Keep it visible. */}
        <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <Label htmlFor="editor-mode" className="text-[10px] sm:text-xs font-medium cursor-pointer">
            Editor
          </Label>
          <Switch
            id="editor-mode"
            checked={isEditorMode}
            onCheckedChange={onEditorModeChange}
            className="scale-75 sm:scale-100"
          />
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block" />

        {(onShowPageHeaderChange || onShowPageFooterChange) && (
          <>
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              {onShowPageHeaderChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-header-toggle" className="text-xs font-medium cursor-pointer">
                    Page Header
                  </Label>
                  <Switch
                    id="page-header-toggle"
                    checked={showPageHeader}
                    onCheckedChange={onShowPageHeaderChange}
                    className="scale-90"
                  />
                </div>
              )}
              {onShowPageHeaderChange && onShowPageFooterChange && (
                <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
              )}
              {onShowPageFooterChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-footer-toggle" className="text-xs font-medium cursor-pointer">
                    Page Footer
                  </Label>
                  <Switch
                    id="page-footer-toggle"
                    checked={showPageFooter}
                    onCheckedChange={onShowPageFooterChange}
                    className="scale-90"
                  />
                </div>
              )}
              {onShowPageFooterChange && onFooterPageLabelPositionChange && showPageFooter && (
                <>
                  <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Footer Label</span>
                    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
                      <button
                        type="button"
                        aria-pressed={footerPageLabelPosition === 'left'}
                        onClick={() => onFooterPageLabelPositionChange('left')}
                        className={`px-2 py-1 text-xs transition-colors ${
                          footerPageLabelPosition === 'left'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        aria-pressed={footerPageLabelPosition === 'right'}
                        onClick={() => onFooterPageLabelPositionChange('right')}
                        className={`px-2 py-1 text-xs transition-colors ${
                          footerPageLabelPosition === 'right'
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 hidden lg:block" />
          </>
        )}

        {/* --- DESKTOP ACTIONS --- */}
        <div className="hidden md:flex items-center gap-2">
          {/* Text Alignment Dropdown */}
          {textAlign && onTextAlignChange && (
            <JustifyDropdown value={textAlign} onChange={onTextAlignChange} />
          )}

          {onPageSizeChange && (
            <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
          )}

          {typeof tableFontSize === 'number' && onTableFontSizeChange && (
            <TableFontSizeDropdown value={tableFontSize} onChange={onTableFontSizeChange} />
          )}

          {/* Ruler Toggle Button */}
          {onToggleRuler && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggleRuler}
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${rulerVisible ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                  >
                    <Ruler className="w-4 h-4" />
                    <span className="hidden lg:inline">Ruler</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Ruler (Ctrl+Shift+R)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Margin Toggle Button */}
          {onToggleMarginGuides && (
            <MarginDropdown
              marginGuidesVisible={marginGuidesVisible}
              onToggleMarginGuides={onToggleMarginGuides}
              currentMargin={currentMargin || 1.0}
              onMarginChange={onMarginChange || (() => { })}
            />
          )}

          {/* Apply Template Button - Only in editor mode */}
          {isEditorMode && onApplyTemplate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onApplyTemplate}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    <span className="hidden lg:inline">Template</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Apply Template</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Save Draft Button - Only in editor mode */}
          {isEditorMode && onSaveDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onSaveDraft}
                    variant="outline"
                    size="sm"
                    disabled={!isDirty || isSaving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden lg:inline">{isSaving ? 'Saving...' : 'Save Draft'}</span>
                    <span className="lg:hidden">{isSaving ? '...' : 'Save'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Draft</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* --- TABLET/MOBILE ACTIONS --- */}
        <div className="flex md:hidden items-center gap-1">
          {isEditorMode && onSaveDraft && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onSaveDraft}
                    variant="outline"
                    size="icon"
                    disabled={!isDirty || isSaving}
                    className="h-8 w-8"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Draft</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {textAlign && onTextAlignChange && (
            <JustifyDropdown value={textAlign} onChange={onTextAlignChange} />
          )}

          {onPageSizeChange && (
            <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
          )}

          {typeof tableFontSize === 'number' && onTableFontSizeChange && (
            <TableFontSizeDropdown value={tableFontSize} onChange={onTableFontSizeChange} />
          )}

          <ResponsiveMoreMenu>
            <div className="flex items-center justify-between px-2 py-1.5 sm:hidden">
              <span className="text-xs font-medium">Editor Mode</span>
              <Switch
                checked={isEditorMode}
                onCheckedChange={onEditorModeChange}
                className="scale-75"
              />
            </div>

            {onShowPageHeaderChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium">Page Header</span>
                <Switch
                  checked={showPageHeader}
                  onCheckedChange={onShowPageHeaderChange}
                  className="scale-75"
                />
              </div>
            )}

            {onShowPageFooterChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium">Page Footer</span>
                <Switch
                  checked={showPageFooter}
                  onCheckedChange={onShowPageFooterChange}
                  className="scale-75"
                />
              </div>
            )}

            {onShowPageFooterChange && onFooterPageLabelPositionChange && showPageFooter && (
              <div className="px-2 py-1.5">
                <span className="text-xs font-medium">Footer Label Position</span>
                <div className="mt-1 inline-flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
                  <button
                    type="button"
                    aria-pressed={footerPageLabelPosition === 'left'}
                    onClick={() => onFooterPageLabelPositionChange('left')}
                    className={`px-2 py-1 text-xs transition-colors ${
                      footerPageLabelPosition === 'left'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    aria-pressed={footerPageLabelPosition === 'right'}
                    onClick={() => onFooterPageLabelPositionChange('right')}
                    className={`px-2 py-1 text-xs transition-colors ${
                      footerPageLabelPosition === 'right'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            )}

            {onToggleRuler && (
              <DropdownMenuItem onClick={onToggleRuler}>
                <Ruler className="w-4 h-4 mr-2" />
                {rulerVisible ? 'Hide Ruler' : 'Show Ruler'}
              </DropdownMenuItem>
            )}

            {onToggleMarginGuides && (
              <DropdownMenuItem onClick={onToggleMarginGuides}>
                <Square className="w-4 h-4 mr-2" />
                {marginGuidesVisible ? 'Hide Margins' : 'Show Margins'}
              </DropdownMenuItem>
            )}

            {isEditorMode && onApplyTemplate && (
              <DropdownMenuItem onClick={onApplyTemplate}>
                <Palette className="w-4 h-4 mr-2" />
                Apply Template
              </DropdownMenuItem>
            )}

            {!onSaveDraft && isEditorMode && (
              <DropdownMenuItem disabled>
                <Save className="w-4 h-4 mr-2" />
                No Save Option
              </DropdownMenuItem>
            )}
          </ResponsiveMoreMenu>
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block" />

        {/* Close */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close Preview</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
