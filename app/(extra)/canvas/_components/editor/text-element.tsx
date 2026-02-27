// app/(extra)/canvas/_components/editor/text-element.tsx (UPDATED - Data attributes)

'use client';

import React from "react"
import { useState } from 'react';
import { X } from 'lucide-react';
import { TextElement } from "../editor";

const TABLE_LINE_HEIGHT = 1.2;
const TABLE_MIN_ROW_HEIGHT = 22;
const TABLE_MIN_HEADER_ROW_HEIGHT = 30;
const TABLE_ROW_RENDER_SAFETY = 8;
const TABLE_HEADER_RENDER_SAFETY = 5;
const TABLE_CELL_HORIZONTAL_PADDING = 6;

function resolveLineHeight(lineHeight: TextElement['lineHeight']): number {
  if (typeof lineHeight === 'number' && Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }
  return TABLE_LINE_HEIGHT;
}

function getTableRowKind(elementId: string): 'header' | 'data' | 'category' | 'total' | null {
  if (elementId.startsWith('header-')) return 'header';
  if (elementId.startsWith('cell-')) return 'data';
  if (elementId.startsWith('category-header-')) return 'category';
  if (elementId.startsWith('total-')) return 'total';
  return null;
}

function getPreviewTableRowHeight(element: TextElement): number {
  const rowKind = getTableRowKind(element.id);
  if (rowKind === 'category' || rowKind === 'total') {
    return Math.max(TABLE_MIN_ROW_HEIGHT, element.height);
  }

  if (rowKind === 'header' || rowKind === 'data') {
    const lineHeight = resolveLineHeight(element.lineHeight);
    const lineCount = Math.max(1, element.text.split('\n').length);
    const contentHeight = lineCount * element.fontSize * lineHeight;
    const minRowHeight = rowKind === 'header' ? TABLE_MIN_HEADER_ROW_HEIGHT : TABLE_MIN_ROW_HEIGHT;
    const renderSafety = rowKind === 'header' ? TABLE_HEADER_RENDER_SAFETY : TABLE_ROW_RENDER_SAFETY;
    const normalizedHeight = Math.max(contentHeight + renderSafety, minRowHeight);
    return Math.max(normalizedHeight, element.height);
  }

  return Math.max(TABLE_MIN_ROW_HEIGHT, element.height);
}

interface TextElementComponentProps {
  element: TextElement;
  isSelected: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onUpdateText: (text: string) => void;
  onEditingChange: (isEditing: boolean) => void;
}

export default function TextElementComponent({
  element,
  isSelected,
  isEditing,
  onMouseDown,
  onDelete,
  onUpdateText,
  onEditingChange,
}: TextElementComponentProps) {
  const CATEGORY_ROW_TEXT_LEFT_PADDING = TABLE_CELL_HORIZONTAL_PADDING;
  const [editText, setEditText] = useState(element.text);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isEditingLocal, setIsEditingLocal] = useState(isEditing);
  const isCategoryRow = element.id.startsWith('category-header-');
  const isTableText = Boolean(
    element.groupId && element.groupName?.toLowerCase().includes('table')
  );
  const tableRowHeight = isTableText ? getPreviewTableRowHeight(element) : null;
  const resolvedTextAlign = element.textAlign || 'left';
  const tableHorizontalInsetStyle: React.CSSProperties =
    !isTableText || isCategoryRow
      ? {}
      : resolvedTextAlign === 'right'
        ? { paddingRight: `${TABLE_CELL_HORIZONTAL_PADDING}px` }
        : resolvedTextAlign === 'left'
          ? { paddingLeft: `${TABLE_CELL_HORIZONTAL_PADDING}px` }
          : {};
  const textStyles = getTextStyles();

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
    setEditText(element.text);
    setIsEditingLocal(isEditing);
  }, [isEditing, element.text]);

  const handleDoubleClick = () => {
    if (element.locked) return;
    setIsEditingLocal(true);
    onEditingChange(true);
  };

  const handleBlur = () => {
    onUpdateText(editText || 'Edit text');
    setIsEditingLocal(false);
    onEditingChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditingLocal(false);
      onEditingChange(false);
    }
  };

  function getTextStyles() {
    const styles: React.CSSProperties = {
      fontSize: `${element.fontSize}px`,
      fontWeight: element.bold ? 700 : 400,
      fontStyle: element.italic ? 'italic' : 'normal',
      textDecoration: element.underline ? 'underline' : 'none',
      color: element.color,
      backgroundColor: isCategoryRow ? undefined : element.backgroundColor,
      textShadow: element.shadow ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
      WebkitTextStroke: element.outline ? '0.5px rgba(0,0,0,0.5)' : 'none',
      lineHeight: element.lineHeight ?? 'normal', // Apply line height multiplier
      textAlign: element.textAlign || 'left',
    };

    const googleFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
    if (googleFonts.includes(element.fontFamily)) {
      styles.fontFamily = `'${element.fontFamily}', sans-serif`;
    } else if (element.fontFamily === 'font-serif') {
      styles.fontFamily = 'Georgia, serif';
    } else if (element.fontFamily === 'font-mono') {
      styles.fontFamily = 'monospace';
    } else if (element.fontFamily.includes('light')) {
      styles.fontWeight = 300;
      styles.fontFamily = 'sans-serif';
    } else if (element.fontFamily.includes('bold')) {
      styles.fontWeight = 700;
      styles.fontFamily = 'sans-serif';
    } else {
      styles.fontFamily = 'sans-serif';
    }

    return styles;
  }

  return (
    <div
      data-element-type="text"
      data-element-id={element.id}
      onMouseDown={onMouseDown}
      className={`absolute ${isSelected ? 'ring-2 ring-blue-500' : ''
        } ${element.locked ? 'cursor-not-allowed opacity-70' : ''} transition-all cursor-move`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: isCategoryRow ? `${element.height}px` : tableRowHeight ? `${tableRowHeight}px` : undefined,
        minHeight: `${tableRowHeight ?? element.height}px`,
        backgroundColor: isCategoryRow ? element.backgroundColor : undefined,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full border border-blue-500 rounded resize-none focus:outline-none"
          style={{
            ...getTextStyles(),
            boxSizing: 'border-box',
            ...tableHorizontalInsetStyle,
          }}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          onClick={(e) => e.stopPropagation()}
          className={`w-full h-full break-words whitespace-pre-wrap ${isSelected ? 'bg-blue-50' : ''
            }`}
          style={{
            ...textStyles,
            ...(isTableText && !isCategoryRow ? {
              display: 'flex',
              alignItems: 'center',
            } : {}),
            ...(isCategoryRow ? {
              display: 'flex',
              alignItems: 'center',
              paddingLeft: `${CATEGORY_ROW_TEXT_LEFT_PADDING}px`,
              boxSizing: 'border-box',
            } : {}),
          }}
        >
          {isTableText && !isCategoryRow ? (
            <div
              className="w-full break-words whitespace-pre-wrap"
              style={{
                ...textStyles,
                width: '100%',
                boxSizing: 'border-box',
                ...tableHorizontalInsetStyle,
              }}
            >
              {element.text}
            </div>
          ) : (
            element.text
          )}
        </div>
      )}

      {isSelected && !element.locked && (
        <>
          <div
            className="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-nwse-resize rounded-sm"
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e);
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-6 -right-6 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
            title="Delete element"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}
