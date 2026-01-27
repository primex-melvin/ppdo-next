# Shared Table Utilities

This directory contains reusable table utilities and cell renderers for consistent data formatting across the application.

## Column Definitions

The `column-definitions.tsx` file provides standardized cell renderers for common data types.

### Available Cell Renderers

Each cell renderer provides:
- `className`: Tailwind classes for consistent styling
- `render({ value, row })`: Function that returns a React node

#### Currency Cell
Formats numbers as PHP currency with right alignment.
```tsx
import { currencyCell } from '@/lib/shared/table';

// In your table:
<td className={currencyCell.className}>
  {currencyCell.render({ value: breakdown.allocatedBudget })}
</td>
```

#### Date Cell
Formats timestamps as localized date strings.
```tsx
import { dateCell } from '@/lib/shared/table';

<td className={dateCell.className}>
  {dateCell.render({ value: breakdown.dateStarted })}
</td>
```

#### Status Badge Cell
Renders colored status text (completed/ongoing/delayed).
```tsx
import { statusBadgeCell } from '@/lib/shared/table';

<td className={statusBadgeCell.className}>
  {statusBadgeCell.render({ value: breakdown.status })}
</td>
```

#### Percentage Cell
Formats numbers as percentages with 1 decimal place.
```tsx
import { percentageCell } from '@/lib/shared/table';

<td className={percentageCell.className}>
  {percentageCell.render({ value: breakdown.projectAccomplishment })}
</td>
```

#### Utilization Cell
Shows percentage with color coding (red: ≥80%, orange: ≥60%, green: <60%).
```tsx
import { utilizationCell } from '@/lib/shared/table';

<td className={utilizationCell.className}>
  {utilizationCell.render({ value: breakdown.utilizationRate })}
</td>
```

#### Text Cell
Basic text rendering with null/undefined handling.
```tsx
import { textCell } from '@/lib/shared/table';

<td className={textCell.className}>
  {textCell.render({ value: breakdown.projectTitle })}
</td>
```

#### Number Cell
Formats numbers with thousand separators.
```tsx
import { numberCell } from '@/lib/shared/table';

<td className={numberCell.className}>
  {numberCell.render({ value: breakdown.quantity })}
</td>
```

### Helper Functions

#### getCellRenderer(type)
Get the appropriate cell renderer based on column type.
```tsx
import { getCellRenderer } from '@/lib/shared/table';

const renderer = getCellRenderer('currency');
<td className={renderer.className}>
  {renderer.render({ value: 1000000 })}
</td>
```

#### renderCell(value, columnType, row?)
Simplified API for rendering cells.
```tsx
import { renderCell } from '@/lib/shared/table';

<td className="text-right">
  {renderCell(breakdown.allocatedBudget, 'currency')}
</td>
```

#### getCellClassName(columnType)
Get the className for a column type.
```tsx
import { getCellClassName } from '@/lib/shared/table';

<td className={getCellClassName('currency')}>
  {formatCurrency(value)}
</td>
```

### Migration Example

**Before:**
```tsx
<td className="text-right">
  <div className="text-right tabular-nums">
    {value ? new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(value) : '-'}
  </div>
</td>
```

**After:**
```tsx
import { currencyCell } from '@/lib/shared/table';

<td className={currencyCell.className}>
  {currencyCell.render({ value })}
</td>
```

Or even simpler:
```tsx
import { renderCell, getCellClassName } from '@/lib/shared/table';

<td className={getCellClassName('currency')}>
  {renderCell(value, 'currency')}
</td>
```

## Benefits

- **DRY Principle**: Define formatting logic once, use everywhere
- **Consistency**: All tables format data the same way
- **Maintainability**: Update formatting in one place
- **Type Safety**: TypeScript support for cell renderers
- **Accessibility**: Proper null/undefined handling
- **Performance**: Optimized Intl.NumberFormat instances
