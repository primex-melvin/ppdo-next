# Print System

> Canvas-based print preview and PDF generation

---

## Overview

The print system provides high-quality printable outputs for tables and reports using HTML5 Canvas rendering.

**Features:**
- Canvas-based rendering for precise layout control
- PDF generation via jsPDF
- Print template system
- Draft saving/loading
- Column visibility control
- Page orientation (portrait/landscape)

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        PRINT SYSTEM                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                  â”‚
â”‚  Data Source                                                     â”‚
â”‚  â”œâ”€â”€ Budget Items                                               â”‚
â”‚  â”œâ”€â”€ Projects                                                   â”‚
â”‚  â””â”€â”€ Breakdowns                                                 â”‚
â”‚       â”‚                                                          â”‚
â”‚       â–¼                                                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                  Print Adapter                             â”‚  â”‚
â”‚  â”‚  (BudgetPrintAdapter, FundsPrintAdapter, etc.)            â”‚  â”‚
â”‚  â”‚                                                            â”‚  â”‚
â”‚  â”‚  Converts data to print format:                           â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ headers: string[]                                    â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ rows: (string | number)[][]                          â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ columnWidths: number[]                               â”‚  â”‚
â”‚  â”‚  â””â”€â”€ title, subtitle                                      â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚       â”‚                                                          â”‚
â”‚       â–¼                                                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                PrintPreviewModal                           â”‚  â”‚
â”‚  â”‚                                                            â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ Canvas rendering engine                              â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ Column visibility panel                              â”‚  â”‚
â”‚  â”‚  â”œâ”€â”€ Template selector                                    â”‚  â”‚
â”‚  â”‚  â””â”€â”€ Toolbar actions                                      â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚       â”‚                                                          â”‚
â”‚       â–¼                                                          â”‚
â”‚  Output Options                                                  â”‚
â”‚  â”œâ”€â”€ Browser Print (window.print())                            â”‚
â”‚  â”œâ”€â”€ PDF Download (jsPDF)                                      â”‚
â”‚  â””â”€â”€ Save Draft (localStorage)                                 â”‚
â”‚                                                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Print Adapters

### BudgetPrintAdapter

Converts budget data to print format.

```typescript
// lib/print-adapters/BudgetPrintAdapter.ts

class BudgetPrintAdapter {
  constructor(options: {
    budgetItems: BudgetItem[];
    columns: ColumnConfig[];
    year: number;
    title?: string;
  }) {
    this.data = options.budgetItems;
    this.columns = options.columns;
    this.year = options.year;
    this.title = options.title || `Budget Items ${year}`;
  }
  
  toPrintFormat(): PrintData {
    return {
      title: this.title,
      subtitle: `Fiscal Year ${this.year}`,
      headers: this.columns.map(col => col.label),
      rows: this.data.map(item =>
        this.columns.map(col => this.formatCell(item, col))
      ),
      columnWidths: this.columns.map(col => col.width),
      pageSize: "A4",
      orientation: "landscape",
    };
  }
  
  private formatCell(item: BudgetItem, column: ColumnConfig): string {
    switch (column.id) {
      case "particularName":
        return item.particularName || "";
      case "totalBudgetAllocated":
        return formatCurrency(item.totalBudgetAllocated);
      case "utilizationRate":
        return `${item.utilizationRate.toFixed(2)}%`;
      default:
        return String(item[column.id] ?? "");
    }
  }
}
```

### Usage

```typescript
const adapter = new BudgetPrintAdapter({
  budgetItems,
  columns: visibleColumns,
  year: 2025,
  title: "Provincial Budget 2025",
});

const printData = adapter.toPrintFormat();
```

---

## Print Preview Modal

### PrintPreviewModal Component

Main modal for print preview.

```typescript
interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintData;
  onPrint: () => void;
  onSavePDF: () => void;
}
```

### Features

#### 1. Canvas Rendering

Renders table to canvas for precise control:

```typescript
function renderTableToCanvas(
  canvas: HTMLCanvasElement,
  data: PrintData
) {
  const ctx = canvas.getContext("2d")!;
  
  // Set canvas size based on orientation
  const width = data.orientation === "landscape" ? 1123 : 794;  // A4 pixels at 96 DPI
  const height = data.orientation === "landscape" ? 794 : 1123;
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw title
  ctx.font = "bold 24px Arial";
  ctx.fillText(data.title, 40, 40);
  
  // Draw subtitle
  ctx.font = "16px Arial";
  ctx.fillText(data.subtitle, 40, 70);
  
  // Draw table
  const tableY = 100;
  drawTable(ctx, data, 40, tableY, width - 80);
}
```

#### 2. Column Visibility Panel

Toggle which columns appear in print:

```typescript
<ColumnVisibilityPanel
  columns={allColumns}
  visibleColumns={visibleColumnIds}
  onToggle={(columnId) => {
    setVisibleColumnIds(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  }}
/>
```

#### 3. Template System

Save and apply print configurations:

```typescript
interface PrintTemplate {
  id: string;
  name: string;
  columnVisibility: string[];
  columnWidths: number[];
  orientation: "portrait" | "landscape";
  showBorders: boolean;
  fontSize: number;
}

// Save template
const saveTemplate = (template: PrintTemplate) => {
  const templates = JSON.parse(
    localStorage.getItem("print-templates") || "[]"
  );
  templates.push(template);
  localStorage.setItem("print-templates", JSON.stringify(templates));
};

// Apply template
const applyTemplate = (template: PrintTemplate) => {
  setVisibleColumnIds(template.columnVisibility);
  setOrientation(template.orientation);
  // ... apply other settings
};
```

#### 4. Draft System

Save and resume print drafts:

```typescript
// _lib/usePrintPreviewDraft.ts

function usePrintPreviewDraft() {
  const saveDraft = (data: PrintData) => {
    localStorage.setItem(
      "print-draft",
      JSON.stringify({
        data,
        savedAt: Date.now(),
      })
    );
  };
  
  const loadDraft = (): PrintData | null => {
    const saved = localStorage.getItem("print-draft");
    if (!saved) return null;
    
    const { data, savedAt } = JSON.parse(saved);
    // Check if draft is recent (e.g., < 7 days)
    if (Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("print-draft");
      return null;
    }
    return data;
  };
  
  const clearDraft = () => {
    localStorage.removeItem("print-draft");
  };
  
  return { saveDraft, loadDraft, clearDraft };
}
```

---

## PDF Generation

### Using jsPDF

```typescript
import jsPDF from "jspdf";

function generatePDF(data: PrintData) {
  const pdf = new jsPDF({
    orientation: data.orientation,
    unit: "pt",
    format: data.pageSize.toLowerCase(),
  });
  
  // Add title
  pdf.setFontSize(24);
  pdf.text(data.title, 40, 40);
  
  // Add subtitle
  pdf.setFontSize(14);
  pdf.text(data.subtitle, 40, 60);
  
  // Add table
  const tableStartY = 80;
  let currentY = tableStartY;
  
  // Headers
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  let currentX = 40;
  data.headers.forEach((header, i) => {
    pdf.text(header, currentX, currentY);
    currentX += data.columnWidths[i];
  });
  
  // Rows
  pdf.setFont("helvetica", "normal");
  currentY += 20;
  data.rows.forEach(row => {
    currentX = 40;
    row.forEach((cell, i) => {
      pdf.text(String(cell), currentX, currentY);
      currentX += data.columnWidths[i];
    });
    currentY += 16;
  });
  
  pdf.save(`${data.title}.pdf`);
}
```

---

## Integration Example

### Complete Print Flow

```tsx
"use client";

import { PrintPreviewModal } from "@/components/features/ppdo/table/print-preview";
import { BudgetPrintAdapter } from "./lib/print-adapters/BudgetPrintAdapter";
import jsPDF from "jspdf";

function BudgetPage() {
  const budgetItems = useQuery(api.budgetItems.getByYear, { year: 2025 });
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);
  
  const handlePrintPreview = () => {
    const adapter = new BudgetPrintAdapter({
      budgetItems: budgetItems || [],
      columns: VISIBLE_COLUMNS,
      year: 2025,
    });
    
    setPrintData(adapter.toPrintFormat());
    setShowPrintPreview(true);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleSavePDF = () => {
    if (!printData) return;
    
    const pdf = new jsPDF({
      orientation: printData.orientation,
      format: printData.pageSize.toLowerCase(),
    });
    
    // Render content...
    
    pdf.save(`${printData.title}.pdf`);
  };
  
  return (
    <>
      <BudgetTrackingTable
        data={budgetItems}
        onPrintPreview={handlePrintPreview}
      />
      
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        data={printData}
        onPrint={handlePrint}
        onSavePDF={handleSavePDF}
      />
    </>
  );
}
```

---

## Print Styling

### CSS for Print

```css
/* print-styles.css */

@media print {
  /* Hide non-print elements */
  .no-print,
  .sidebar,
  .header,
  .toolbar {
    display: none !important;
  }
  
  /* Ensure table prints properly */
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #000;
    padding: 8px;
  }
  
  /* Page breaks */
  tr {
    page-break-inside: avoid;
  }
  
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
}
```

---

## Related Documentation

- [Budget Items](./03-budget-items.md)
- [Table Components](../../../components/ppdo/docs/06-table-components.md)