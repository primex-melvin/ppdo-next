// app/dashboard/project/[year]/components/hooks/usePrintPreviewActions.ts (NEW FILE)

import { useCallback } from 'react';
import { Page, HeaderFooter, CanvasElement } from '@/app/(extra)/canvas/_components/editor/types';
import { createNewPage, generateId } from '@/app/(extra)/canvas/_components/editor/utils';
import { toast } from 'sonner';

interface UsePrintPreviewActionsProps {
  currentPageIndex: number;
  setCurrentPageIndex: (index: number | ((prev: number) => number)) => void;
  header: HeaderFooter;
  footer: HeaderFooter;
  setPages: (updater: (prev: Page[]) => Page[]) => void;
  setHeader: (updater: (prev: HeaderFooter) => HeaderFooter) => void;
  setFooter: (updater: (prev: HeaderFooter) => HeaderFooter) => void;
  setSelectedElementId: (id: string | null) => void;
  setIsDirty: (dirty: boolean) => void;
}

export function usePrintPreviewActions({
  currentPageIndex,
  setCurrentPageIndex,
  header,
  footer,
  setPages,
  setHeader,
  setFooter,
  setSelectedElementId,
  setIsDirty,
}: UsePrintPreviewActionsProps) {

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      const isInHeader = header.elements.some((el) => el.id === id);
      if (isInHeader) {
        setHeader((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? ({ ...el, ...updates } as any) : el
          ),
        }));
        setIsDirty(true);
        return;
      }

      const isInFooter = footer.elements.some((el) => el.id === id);
      if (isInFooter) {
        setFooter((prev) => ({
          ...prev,
          elements: prev.elements.map((el) =>
            el.id === id ? ({ ...el, ...updates } as any) : el
          ),
        }));
        setIsDirty(true);
        return;
      }

      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex
            ? {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id ? ({ ...el, ...updates } as any) : el
              ),
            }
            : page
        )
      );
      setIsDirty(true);
    },
    [currentPageIndex, header, footer, setPages, setHeader, setFooter, setIsDirty]
  );

  const deleteElement = useCallback(
    (id: string) => {
      const isInHeader = header.elements.some((el) => el.id === id);
      if (isInHeader) {
        setHeader((prev) => ({
          ...prev,
          elements: prev.elements.filter((el) => el.id !== id),
        }));
        setSelectedElementId(null);
        setIsDirty(true);
        return;
      }

      const isInFooter = footer.elements.some((el) => el.id === id);
      if (isInFooter) {
        setFooter((prev) => ({
          ...prev,
          elements: prev.elements.filter((el) => el.id !== id),
        }));
        setSelectedElementId(null);
        setIsDirty(true);
        return;
      }

      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex
            ? { ...page, elements: page.elements.filter((el) => el.id !== id) }
            : page
        )
      );
      setSelectedElementId(null);
      setIsDirty(true);
    },
    [currentPageIndex, header, footer, setPages, setHeader, setFooter, setSelectedElementId, setIsDirty]
  );

  const changePageSize = useCallback(
    (size: 'A4' | 'Short' | 'Long') => {
      setPages((prev) => prev.map((page) => ({ ...page, size })));
      setIsDirty(true);
    },
    [setPages, setIsDirty]
  );

  const changeOrientation = useCallback(
    (orientation: 'portrait' | 'landscape') => {
      setPages((prev) => prev.map((page) => ({ ...page, orientation })));
      setIsDirty(true);
    },
    [setPages, setIsDirty]
  );

  const reorderElements = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPages((prev) =>
        prev.map((page, idx) => {
          if (idx !== currentPageIndex) return page;
          const newElements = [...page.elements];
          const [movedElement] = newElements.splice(fromIndex, 1);
          newElements.splice(toIndex, 0, movedElement);
          return { ...page, elements: newElements };
        })
      );
      setIsDirty(true);
    },
    [currentPageIndex, setPages, setIsDirty]
  );

  const updateHeaderBackground = useCallback(
    (color: string) => {
      setHeader((prev) => ({ ...prev, backgroundColor: color }));
      setIsDirty(true);
    },
    [setHeader, setIsDirty]
  );

  const updateFooterBackground = useCallback(
    (color: string) => {
      setFooter((prev) => ({ ...prev, backgroundColor: color }));
      setIsDirty(true);
    },
    [setFooter, setIsDirty]
  );

  const updatePageBackground = useCallback(
    (color: string) => {
      setPages((prev) =>
        prev.map((p, i) => (i === currentPageIndex ? { ...p, backgroundColor: color } : p))
      );
      setIsDirty(true);
    },
    [currentPageIndex, setPages, setIsDirty]
  );

  // --- Page Operations ---

  const addPage = useCallback(() => {
    setPages(prev => {
      const lastPage = prev[prev.length - 1];
      const newPage = createNewPage(lastPage?.size || 'A4', lastPage?.orientation || 'portrait');
      const newPages = [...prev, newPage];
      setCurrentPageIndex(newPages.length - 1);
      return newPages;
    });
    setSelectedElementId(null);
    setIsDirty(true);
    toast.success('Page added');
  }, [setPages, setCurrentPageIndex, setSelectedElementId, setIsDirty]);

  const duplicatePage = useCallback((index: number) => {
    setPages((prev) => {
      const pageToDuplicate = prev[index];
      if (!pageToDuplicate) return prev;

      const newPage: Page = {
        ...pageToDuplicate,
        id: generateId(),
        elements: pageToDuplicate.elements.map((el) => ({
          ...el,
          id: generateId(),
        })),
      };

      const newPages = [...prev.slice(0, index + 1), newPage, ...prev.slice(index + 1)];
      setCurrentPageIndex(index + 1);
      return newPages;
    });
    setSelectedElementId(null);
    setIsDirty(true);
    toast.success('Page duplicated');
  }, [setPages, setCurrentPageIndex, setSelectedElementId, setIsDirty]);

  const deletePage = useCallback((index: number) => {
    setPages((prev) => {
      if (prev.length === 1) {
        // Reset last page instead of deleting
        const newPage = createNewPage(prev[0].size, prev[0].orientation);
        setCurrentPageIndex(0);
        return [newPage];
      }

      const newPages = prev.filter((_, i) => i !== index);
      setCurrentPageIndex((prevIdx) => {
        if (prevIdx === index) {
          return index > 0 ? index - 1 : 0;
        }
        return prevIdx > index ? prevIdx - 1 : prevIdx;
      });
      return newPages;
    });
    setSelectedElementId(null);
    setIsDirty(true);
    toast.success('Page deleted');
  }, [setPages, setCurrentPageIndex, setSelectedElementId, setIsDirty]);

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);

      setCurrentPageIndex((prevIdx) => {
        if (prevIdx === fromIndex) return toIndex;
        if (prevIdx > fromIndex && prevIdx <= toIndex) return prevIdx - 1;
        if (prevIdx < fromIndex && prevIdx >= toIndex) return prevIdx + 1;
        return prevIdx;
      });

      return newPages;
    });
    setIsDirty(true);
  }, [setPages, setCurrentPageIndex, setIsDirty]);

  return {
    updateElement,
    deleteElement,
    changePageSize,
    changeOrientation,
    reorderElements,
    updateHeaderBackground,
    updateFooterBackground,
    updatePageBackground,
    addPage,
    duplicatePage,
    deletePage,
    reorderPages,
  };
}