# Print Preview Toolbar

**Location**: `components/ppdo/table/print-preview/PrintPreviewToolbar.tsx`

The Print Preview Toolbar is a specialized toolbar for the print/export document editor view.

## Overview

This toolbar appears when users open the print preview modal. It provides controls for:

- Document title editing
- Editor mode toggle
- Ruler and margin guides
- Template application
- Draft saving
- Navigation

## Props Interface

```typescript
interface PrintPreviewToolbarProps {
  // Document
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedTime: string;

  // Navigation
  onBack: () => void;
  onClose: () => void;

  // Actions
  onSaveDraft?: () => void;
  onApplyTemplate?: () => void;

  // Editor Mode
  isEditorMode: boolean;
  onEditorModeChange: (enabled: boolean) => void;

  // Visual Guides
  rulerVisible?: boolean;
  onToggleRuler?: () => void;
  marginGuidesVisible?: boolean;
  onToggleMarginGuides?: () => void;

  // Page Settings
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: string;
  currentMargin?: number;
  onMarginChange?: (value: number) => void;
}
```

## Layout Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│ [← Back] │ Document Title          │ [Editor] │ [Ruler] [Margin]      │
│          │ Saved 2 minutes ago     │  [ON]    │ [Template] [Save] [×] │
└────────────────────────────────────────────────────────────────────────┘
     LEFT          CENTER               MIDDLE         RIGHT
```

## Features

### 1. Document Title Editor

Inline-editable document title:

```tsx
<DocumentTitleEditor
  title={documentTitle}
  onTitleChange={onTitleChange}
  isEditorMode={isEditorMode}
  isDirty={isDirty}
/>
```

Displays below the title:
- **Unsaved changes** (amber text) when `isDirty`
- **Saved {time}** when saved

### 2. Editor Mode Toggle

Switch between view and edit modes:

```tsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-md border">
  <Label htmlFor="editor-mode">Editor</Label>
  <Switch
    id="editor-mode"
    checked={isEditorMode}
    onCheckedChange={onEditorModeChange}
  />
</div>
```

### 3. Visual Guides

#### Ruler Toggle
```tsx
{onToggleRuler && (
  <Button
    onClick={onToggleRuler}
    variant="outline"
    className={rulerVisible ? 'bg-zinc-100' : ''}
  >
    <Ruler className="w-4 h-4" />
    Ruler
  </Button>
)}
```

#### Margin Dropdown
```tsx
<MarginDropdown
  marginGuidesVisible={marginGuidesVisible}
  onToggleMarginGuides={onToggleMarginGuides}
  currentMargin={currentMargin || 1.0}
  onMarginChange={onMarginChange}
/>
```

### 4. Template Application

Only visible in editor mode:

```tsx
{isEditorMode && onApplyTemplate && (
  <Button onClick={onApplyTemplate} variant="outline">
    <Palette className="w-4 h-4" />
    Template
  </Button>
)}
```

### 5. Save Draft

Only visible in editor mode with unsaved changes:

```tsx
{isEditorMode && onSaveDraft && (
  <Button
    onClick={onSaveDraft}
    variant="outline"
    disabled={!isDirty || isSaving}
  >
    <Save className="w-4 h-4" />
    {isSaving ? 'Saving...' : 'Save Draft'}
  </Button>
)}
```

## Responsive Behavior

### Desktop (md+)
- All actions visible as buttons
- Full labels displayed

### Mobile/Tablet (<md)
- Editor mode toggle in "More" menu
- Compact icons for actions
- ResponsiveMoreMenu contains:
  - Editor mode toggle (on smallest screens)
  - Ruler toggle
  - Margin toggle
  - Template button

```tsx
{/* Mobile More Menu */}
<ResponsiveMoreMenu>
  <div className="flex items-center justify-between px-2 py-1.5 sm:hidden">
    <span>Editor Mode</span>
    <Switch checked={isEditorMode} onCheckedChange={onEditorModeChange} />
  </div>

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
</ResponsiveMoreMenu>
```

## Keyboard Shortcuts

The print preview supports keyboard shortcuts (handled externally):

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+R` | Toggle Ruler |
| `Ctrl+S` | Save Draft |
| `Escape` | Close Preview |

## Integration with Table Toolbars

Print preview is typically opened from the table toolbar's export menu:

```tsx
// In table toolbar
<DropdownMenuItem onClick={onOpenPrintPreview}>
  <Eye className="w-4 h-4 mr-2" />
  Print Preview
  {hasPrintDraft && (
    <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
  )}
</DropdownMenuItem>
```

The blue dot indicator (`hasPrintDraft`) shows when there's an unsaved draft.

## Draft Indicator Pattern

Throughout the system, a blue dot indicates unsaved drafts:

```tsx
// In toolbar button
<Button onClick={onOpenPrintPreview} className="relative">
  <Eye className="w-4 h-4" />
  Print Preview
  {hasPrintDraft && (
    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
  )}
</Button>

// In dropdown item
<DropdownMenuItem onClick={onOpenPrintPreview}>
  <Eye className="w-4 h-4 mr-2" />
  Print Preview
  {hasPrintDraft && (
    <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
  )}
</DropdownMenuItem>
```

## Styling

```css
/* Root container */
.h-16                          /* 64px height */
.bg-white                      /* White background */
.border-b                      /* Bottom border */
.flex.items-center             /* Flex centering */
.justify-between               /* Space between */
.px-4.sm:px-6                  /* Responsive padding */
```
