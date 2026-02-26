# Print Preview / PDF Table Rendering Postmortem (Legacy Dev Notes)

## Scope

This document captures the issues, failed fixes, root causes, and final stable fixes for:

- print preview table row/header layout
- WYSIWYG PDF export text rendering
- table border overlays (preview + PDF)
- multiline row/header behavior
- totals-row placement after row geometry changes

Primary files involved:

- `lib/print-canvas/tableToCanvas.ts`
- `lib/print-canvas/textUtils.ts`
- `lib/export-wysiwyg-pdf.ts`
- `components/features/ppdo/odpp/utilities/table/print-preview/table-borders/TableBorderOverlay.tsx`

## Executive Summary (What Actually Went Wrong)

The table system stores **text boxes**, not true cell rectangles.

Borders in preview/PDF were inferred from text element geometry (`x/y/width/height`). After we changed row padding / row slack for PDF alignment, text-box heights and y-positions no longer perfectly matched the visual cell bounds. That caused:

- text clipping in PDF
- border lines cutting through text
- false/double horizontal lines on multiline rows
- totals row colliding with the last data row

The stable fix was:

1. Move row geometry control to `tableToCanvas` (source of truth)
2. Keep PDF exporter defensive but not "smart" about row layout
3. Recompute borders from **row starts** (`nextY - y`), not text-box heights
4. Place totals row using **estimated row outer bounds**, not text-box bounds

## Mistakes We Made (Do Not Repeat)

## 1) Export-only nudges as primary fix

We tried multiple export-only patches in `lib/export-wysiwyg-pdf.ts`:

- top offsets
- safety height expansion
- flex vertical centering on exported text nodes
- z-index layering tweaks

Some helped temporarily, but they were brittle because the source geometry (table rows) was already inconsistent.

### Lesson

If preview + PDF both look wrong, do not keep stacking exporter hacks. Fix row geometry in `tableToCanvas` first.

## 2) Moving a single header cell (`Utilization Rate`) by changing its `y`

A header-only per-cell nudge fixed the visual alignment of one wrapped header, but it created **two different `y` values in the same row**.

Border overlays infer rows from element `y` values, so they interpreted that header row as two rows and drew an extra horizontal line.

This affected:

- preview overlay (`TableBorderOverlay`)
- PDF export border overlay (`export-wysiwyg-pdf.ts`)

### Lesson

Never move a single table cell's `x/y` independently when borders are inferred from grid positions. Use row-wide adjustments only.

## 3) Assuming `top slack` controls all top spacing

Setting `TABLE_TOP_SLACK_PX = -10` had no effect because `getTopSlackOffset()` clamps negatives to `0`.

Also, the visible top gap mostly came from base inset (`CELL_TEXT_PADDING` and row top inset), not from slack distribution.

### Lesson

Top slack only distributes **extra row slack**. It does not reduce base top spacing.

## 4) Using text-box height to place totals row

After `CELL_TEXT_PADDING = 0`, text-box heights became smaller than the actual visual row height (because of row slack/render safety). Totals row placement used the last text element height, so `TOTAL` overlapped `GAD`.

### Lesson

Anything that depends on row boundaries (totals placement, page-fit checks, border drawing) must use **row outer bounds**, not text-box bounds.

## 5) Using text-box height to infer multiline row borders

Multiline rows have text boxes shorter than the visual row if row safety/slack is present. Border overlays using `row.y + row.height` from text boxes produced a horizontal line inside the row plus another at the actual next row boundary (looked like double lines).

### Lesson

For row borders, use **row-start to next-row-start spacing** whenever possible.

## Final Stable Fixes (What Worked)

## A) Row geometry moved to source (`tableToCanvas`)

`lib/print-canvas/textUtils.ts`

- `calculateWrappedRow(...)` and `calculateWrappedHeader(...)` now expose:
  - `contentHeight`
  - `verticalSlack`
- optional `renderSafetyPx` support added

`lib/print-canvas/tableToCanvas.ts`

- row/header render safety added at conversion time (source geometry)
- row text placement uses slack distribution (`getTopSlackOffset`)
- explicit row/header/category/total top insets introduced
- totals row placement + totals fit-check now use estimated row **outer bottom**

This made preview and PDF share the same intended row layout.

## B) PDF exporter became defensive, not the source of layout truth

`lib/export-wysiwyg-pdf.ts`

- waits for fonts (`document.fonts.ready`) before capture
- improved font family mapping / line-height use
- clips text safely to prevent painting across borders
- renders border overlay below text (`z-index`)
- keeps small safety expansion for table text boxes (descender protection)
- does not try to "outsmart" row layout after source-side fixes

## C) Border overlays fixed to use row starts for multiline rows

Preview:

- `components/features/ppdo/odpp/utilities/table/print-preview/table-borders/TableBorderOverlay.tsx`

PDF export:

- `lib/export-wysiwyg-pdf.ts` (`detectTableStructure`)

Key change:

- row boundaries are inferred from `nextY - y` (row-start to next-row-start), not text-box heights

This fixed the false/double horizontal lines in multiline rows.

## D) Totals row collision fixed after `CELL_TEXT_PADDING = 0`

`lib/print-canvas/tableToCanvas.ts`

- `addTotalsToPage(...)` and `checkSpaceForTotals(...)` no longer trust last text element height
- now use `getPageTableOuterBottom(...)` with row-kind-aware estimation (`header`, `data`, `category`, `total`)

This fixed `GAD` / `TOTAL` overlap.

## Important Invariants (Legacy Dev Guardrails)

## 1) Table rows are inferred from text element positions

If you change one cell's `x/y` inside a row, you may break row detection and border overlays.

Rule:

- only apply row-wide `y` changes
- avoid per-cell `y` nudges

## 2) `CELL_TEXT_PADDING` is not "just visual padding"

It influences:

- wrap width (indirectly, via width math)
- row height estimation
- text box heights
- totals spacing fallback math
- border inference if text box geometry is used

If you set `CELL_TEXT_PADDING = 0`, re-verify:

- multiline rows
- header wrapping
- totals row placement
- border overlays (preview and PDF)

## 3) Preview must be regenerated after geometry changes

Table rows are converted to page elements ahead of export. If you edit converter constants and export immediately from stale preview state, you may think a fix failed.

Always:

- regenerate/reopen print preview
- then export PDF

## 4) Use row-start spacing for borders whenever possible

Text-box height is unreliable once row slack/safety is introduced.

Prefer:

- row-start to next-row-start

Fallback only when there is no next row (last row).

## Recommended Debugging Order (Next Time)

1. Confirm if the issue appears in preview, PDF, or both.
2. If both: inspect `tableToCanvas.ts` first (row geometry).
3. If PDF-only: inspect `lib/export-wysiwyg-pdf.ts` (font loading, line-height, clipping, overlay layering).
4. If borders look wrong: inspect row inference in both overlay implementations.
5. If totals overlap/collide: inspect totals placement and fit checks (outer row bounds, not text bounds).
6. Rebuild/reopen preview before re-testing export.

## What Not To Do (Quick List)

- Do not per-cell nudge header/data `y` in a row (breaks row detection)
- Do not rely on exporter flex-centering as the main fix
- Do not use last text element height as a row boundary
- Do not assume negative top slack works (it is clamped)
- Do not mix visual fixes and geometry fixes without re-checking border inference

## What To Do Instead (Quick List)

- Fix row geometry in `tableToCanvas.ts`
- Keep exporter defensive (font-ready, clipping, layering)
- Compute borders from row starts (`nextY`)
- Compute totals placement from row outer bounds
- Apply row-wide adjustments only

## Session-Specific Notes (Current Stable Direction)

- `CELL_TEXT_PADDING = 0` can work, but it increases sensitivity of header wrapping and row-boundary assumptions
- header rows may need header-only handling (row-height/safety/inset), but do it row-wide
- multiline rows are the canary: if they look wrong, border inference is probably using text-box height somewhere

