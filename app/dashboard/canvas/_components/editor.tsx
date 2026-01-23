// app/dashboard/canvas/_components/editor.tsx

'use client';

import { Toaster } from 'sonner';
import { printAllPages } from '@/lib/print';
import Toolbar from './editor/toolbar';
import Canvas from './editor/canvas';
import PageNavigator from './editor/page-navigator';
import PagePanel from './editor/page-panel';
import BottomPageControls from './editor/bottom-page-controls';
import { useEditorState } from './editor/hooks/useEditorState';
import { useClipboard } from './editor/hooks/useClipboard';
import { useKeyboard } from './editor/hooks/useKeyboard';
import { useStorage, useSaveStorage } from './editor/hooks/useStorage';
import { createNewPage } from './editor/utils';

// Re-export types for backward compatibility
export type { TextElement, ImageElement, CanvasElement, Page } from './editor/types';

export default function Editor() {
  const { isHydrated, savedPages, savedIndex } = useStorage();
  
  const initialPages = savedPages || [createNewPage()];
  const initialIndex = savedIndex ?? 0;

  const {
    pages,
    currentPageIndex,
    currentPage,
    selectedElementId,
    selectedElement,
    isEditingElementId,
    setSelectedElementId,
    setIsEditingElementId,
    addPage,
    duplicatePage,
    deletePage,
    reorderPages,
    changePageSize,
    goToPreviousPage,
    goToNextPage,
    selectPage,
    addText,
    addImage,
    updateElement,
    deleteElement,
    reorderElements,
  } = useEditorState(initialPages, initialIndex);

  useSaveStorage(pages, currentPageIndex, isHydrated);

  useClipboard({
    currentPage,
    selectedElementId,
    isEditingElementId,
    onAddImage: addImage,
  });

  useKeyboard({
    selectedElementId,
    isEditingElementId,
    onDeleteElement: deleteElement,
  });

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      <div className="no-print">
        <PagePanel
          pages={pages}
          currentPageIndex={currentPageIndex}
          onPageSelect={selectPage}
          onAddPage={addPage}
          onReorderPages={reorderPages}
        />
      </div>

      <div className="flex-1 overflow-y-auto no-print" style={{ marginRight: '192px' }}>
        <div className="sticky top-0 z-40 bg-stone-100 border-b border-stone-300 shadow-sm">
          <Toolbar
            selectedElement={selectedElement}
            onUpdateElement={selectedElement ? (updates) => updateElement(selectedElement.id, updates) : undefined}
            onAddText={addText}
            pageSize={currentPage.size}
            onPageSizeChange={changePageSize}
            onPrint={() => printAllPages(pages)}
          />
        </div>
        
        <div className="flex items-center justify-center pt-8 pb-40 px-8 min-h-full">
          <Canvas
            page={currentPage}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={updateElement}
            onDeleteElement={deleteElement}
            isEditingElementId={isEditingElementId}
            onEditingChange={setIsEditingElementId}
          />
        </div>
      </div>

      <div className="no-print">
        <BottomPageControls
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
          onAddPage={addPage}
          onDuplicatePage={duplicatePage}
          onDeletePage={deletePage}
          elements={currentPage.elements}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={updateElement}
          onReorderElements={reorderElements}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
        />
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
}