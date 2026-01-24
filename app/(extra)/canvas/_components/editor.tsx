// app/(extra)/canvas/_components/editor.tsx

'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import { printAllPages } from '@/lib/print';
import Toolbar from './editor/toolbar';
import Canvas from './editor/canvas';
import PagePanel from './editor/page-panel';
import BottomPageControls from './editor/bottom-page-controls';
import LeftSidebar from './editor/left-sidebar/LeftSidebar';
import { useEditorState } from './editor/hooks/useEditorState';
import { useClipboard } from './editor/hooks/useClipboard';
import { useKeyboard } from './editor/hooks/useKeyboard';
import { useStorage, useSaveStorage } from './editor/hooks/useStorage';
import { createNewPage } from './editor/utils';
import type { UploadedImage } from './editor/types/upload';
export type { TextElement, ImageElement, CanvasElement, Page } from './editor/types';

export type ActiveSection = 'header' | 'page' | 'footer';

export interface EditorProps {
  enableUploadPanel?: boolean;
  showPagePanel?: boolean;
  variant?: 'default' | 'modal';
}

export default function Editor({ enableUploadPanel = true, showPagePanel = true, variant = 'default' }: EditorProps = {}) {
  console.group('📋 STEP 6: Canvas Editor - Initialization');
  
  const { isHydrated, savedPages, savedIndex, savedHeader, savedFooter } = useStorage();
  
  console.log('💾 Storage state:');
  console.log('  - isHydrated:', isHydrated);
  console.log('  - savedPages:', savedPages?.length || 0, 'pages');
  console.log('  - savedIndex:', savedIndex);
  console.log('  - savedHeader elements:', savedHeader?.elements.length || 0);
  console.log('  - savedFooter elements:', savedFooter?.elements.length || 0);
  
  if (savedPages && savedPages.length > 0) {
    console.log('  - First page elements:', savedPages[0].elements.length);
    console.log('  - First page sample:', savedPages[0].elements[0]);
  }
  
  console.groupEnd();
  const initialPages = savedPages || [createNewPage()];
  const initialIndex = savedIndex ?? 0;
  const initialHeader = savedHeader || { elements: [] };
  const initialFooter = savedFooter || { elements: [] };

  const [activeSection, setActiveSection] = useState<ActiveSection>('page');

  const {
    pages,
    currentPageIndex,
    currentPage,
    selectedElementId,
    selectedElement,
    isEditingElementId,
    header,
    footer,
    setSelectedElementId,
    setIsEditingElementId,
    addPage,
    duplicatePage,
    deletePage,
    reorderPages,
    changePageSize,
    changeOrientation,
    goToPreviousPage,
    goToNextPage,
    selectPage,
    addText,
    addImage,
    updateElement,
    deleteElement,
    reorderElements,
    updateHeaderBackground,
    updateFooterBackground,
    updatePageBackground,
  } = useEditorState(initialPages, initialIndex, initialHeader, initialFooter);

  useSaveStorage(pages, currentPageIndex, header, footer, isHydrated);

  useClipboard({
    currentPage,
    selectedElementId,
    isEditingElementId,
    onAddImage: (src) => addImage(src, activeSection),
    activeSection,
    header,
    footer,
  });

  useKeyboard({
    selectedElementId,
    isEditingElementId,
    onDeleteElement: deleteElement,
  });

  const allElements = [
    ...header.elements.map(el => ({ ...el, section: 'header' as const })),
    ...currentPage.elements.map(el => ({ ...el, section: 'page' as const })),
    ...footer.elements.map(el => ({ ...el, section: 'footer' as const })),
  ];

  const handleImageSelect = (image: UploadedImage) => {
    // Insert the selected image onto the current page/section
    addImage(image.dataUrl, activeSection);
  };

  return (
    <div className="h-screen bg-stone-50 flex flex-col">
      {/* Sticky Toolbar - Stays at top of editor, doesn't cover navbar/breadcrumb */}
      <div className="sticky top-0 h-auto bg-stone-100 border-b border-stone-300 shadow-md z-40 no-print">
        <Toolbar
          selectedElement={selectedElement}
          onUpdateElement={selectedElement ? (updates) => updateElement(selectedElement.id, updates) : undefined}
          onAddText={() => addText(activeSection)}
          pageSize={currentPage.size}
          orientation={currentPage.orientation}
          onPageSizeChange={changePageSize}
          onOrientationChange={changeOrientation}
          onPrint={() => printAllPages(pages, header, footer)}
          activeSection={activeSection}
          headerBackgroundColor={header.backgroundColor || '#ffffff'}
          footerBackgroundColor={footer.backgroundColor || '#ffffff'}
          pageBackgroundColor={currentPage.backgroundColor || '#ffffff'}
          onHeaderBackgroundChange={updateHeaderBackground}
          onFooterBackgroundChange={updateFooterBackground}
          onPageBackgroundChange={updatePageBackground}
          pages={pages}
          header={header}
          footer={footer}
        />
      </div>

      {/* Main Content Area - Left Sidebar | Canvas | Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Upload Panel */}
        {enableUploadPanel && variant === 'default' && (
          <div className="w-64 border-r border-stone-200 bg-zinc-50 overflow-hidden z-30 flex-shrink-0">
            <LeftSidebar
              enableUploadFeature={enableUploadPanel}
              onImageSelect={handleImageSelect}
            />
          </div>
        )}

        {/* Main Canvas Area - Dynamic width that respects right sidebar */}
        <div className="flex-1 flex flex-row overflow-hidden bg-stone-50 min-w-0">
          {/* Canvas Container - Takes remaining space after right sidebar */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Canvas Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto flex items-start justify-center pt-4 pb-16 px-8 bg-stone-50">
              <Canvas
                page={currentPage}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                isEditingElementId={isEditingElementId}
                onEditingChange={setIsEditingElementId}
                header={header}
                footer={footer}
                pageNumber={currentPageIndex + 1}
                totalPages={pages.length}
                activeSection={activeSection}
                onActiveSectionChange={setActiveSection}
                onImageDropped={handleImageSelect}
              />
            </div>

            {/* Bottom Page Controls */}
            <div className="no-print border-t border-stone-200 bg-white flex-shrink-0">
              <BottomPageControls
                currentPageIndex={currentPageIndex}
                totalPages={pages.length}
                onAddPage={addPage}
                onDuplicatePage={duplicatePage}
                onDeletePage={deletePage}
                elements={allElements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onReorderElements={reorderElements}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
              />
            </div>
          </div>

          {/* Right Sidebar - Page Thumbnails Panel (Only in default variant) */}
          {showPagePanel && variant === 'default' && (
            <div className="w-64 border-l border-stone-200 bg-zinc-50 flex-shrink-0 overflow-y-auto no-print">
              <PagePanel
                pages={pages}
                currentPageIndex={currentPageIndex}
                onPageSelect={selectPage}
                onAddPage={addPage}
                onReorderPages={reorderPages}
                onDuplicatePage={(index) => {
                  selectPage(index);
                  duplicatePage();
                }}
                onDeletePage={(index) => {
                  selectPage(index);
                  deletePage();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}