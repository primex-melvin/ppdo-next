import { FOOTER_HEIGHT, HEADER_HEIGHT } from './constants';
import { HeaderFooter, MarginSettings } from './types';

export const isHeaderVisible = (header?: HeaderFooter): boolean => header?.visible !== false;
export const isFooterVisible = (footer?: HeaderFooter): boolean => footer?.visible !== false;

export interface PageLayoutMetrics {
  headerHeight: number;
  footerHeight: number;
  bodyTop: number;
  bodyHeight: number;
  contentTop: number;
  contentBottom: number;
  contentLeft: number;
  contentRight: number;
  contentWidth: number;
  contentHeight: number;
}

export function getPageLayoutMetrics(
  pageWidth: number,
  pageHeight: number,
  header?: HeaderFooter,
  footer?: HeaderFooter,
  margins?: MarginSettings
): PageLayoutMetrics {
  const headerHeight = isHeaderVisible(header) ? HEADER_HEIGHT : 0;
  const footerHeight = isFooterVisible(footer) ? FOOTER_HEIGHT : 0;
  const bodyTop = headerHeight;
  const bodyHeight = Math.max(0, pageHeight - headerHeight - footerHeight);

  const top = Math.max(0, margins?.top ?? 0);
  const bottom = Math.max(0, margins?.bottom ?? 0);
  const left = Math.max(0, margins?.left ?? 0);
  const right = Math.max(0, margins?.right ?? 0);

  const contentTop = bodyTop + top;
  const contentBottom = bodyTop + Math.max(top, bodyHeight - bottom);
  const contentLeft = left;
  const contentRight = Math.max(left, pageWidth - right);

  return {
    headerHeight,
    footerHeight,
    bodyTop,
    bodyHeight,
    contentTop,
    contentBottom,
    contentLeft,
    contentRight,
    contentWidth: Math.max(0, contentRight - contentLeft),
    contentHeight: Math.max(0, bodyHeight - top - bottom),
  };
}
