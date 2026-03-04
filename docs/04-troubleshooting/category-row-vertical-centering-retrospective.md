# Category Row Vertical-Centering Retrospective

## Problem Statement
Category rows in exported PDFs, such as `SOCIAL`, were consistently rendering too high inside their merged row area. The problem was visible in exported PDF output even when ordinary table data cells looked acceptable.

The issue to solve was narrow and explicit:

- keep category rows left-aligned
- make category labels appear visually centered vertically in exported PDF output
- avoid changing ordinary header, data, and totals cells
- keep the fix shared so both project and 20% DF tables inherit it automatically

## Routes Affected
The category feature currently flows through shared `rowMarkers` logic used by:

- [projects/utils/printAdapters.ts](C:/ppdo/ppdo-next/components/features/ppdo/odpp/table-pages/projects/utils/printAdapters.ts)
- [twenty-percent-df/utils/printAdapters.ts](C:/ppdo/ppdo-next/components/features/ppdo/odpp/table-pages/twenty-percent-df/utils/printAdapters.ts)

That means the observed issue applied to:

- project print preview PDF exports
- 20% DF print preview PDF exports

## Evidence Gathered
- left alignment was eventually corrected, so horizontal positioning was no longer the core problem
- the defect persisted in regular browsing and in Incognito
- the defect was visible specifically in exported PDF output, not just in live preview
- repeated DOM/CSS nudges changed the position slightly but never produced a reliable vertical middle alignment
- ordinary table cells and merged category rows do not behave identically under the current export pipeline

## Attempted Fixes

### 1. Enforced category-row left alignment at source generation
Files:
- [tableToCanvas.ts](C:/ppdo/ppdo-next/lib/print-canvas/tableToCanvas.ts)

Outcome:
- fixed horizontal alignment only
- did not solve exported PDF vertical placement

### 2. Preserved category-row left alignment during print-preview layout transforms
Files:
- [PrintPreviewModal.tsx](C:/ppdo/ppdo-next/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewModal.tsx)

Outcome:
- prevented alignment drift when the preview pipeline normalized table text alignment
- did not fix category-row vertical placement in exported PDF

### 3. Tried preview-side visual nudges for category text
Files:
- [text-element.tsx](C:/ppdo/ppdo-next/app/(extra)/canvas/_components/editor/text-element.tsx)

Outcome:
- affected preview presentation only
- did not fix PDF export output
- this direction was abandoned because the actual bug is in export rendering

### 4. Tried export-side flex centering for category rows
Files:
- [export-wysiwyg-pdf.ts](C:/ppdo/ppdo-next/lib/export-wysiwyg-pdf.ts)

Outcome:
- appeared reasonable in theory
- did not reliably center the actual rendered glyphs
- the DOM text baseline still looked too high after rasterization

### 5. Tried fixed-pixel transform nudges in export
Files:
- [export-wysiwyg-pdf.ts](C:/ppdo/ppdo-next/lib/export-wysiwyg-pdf.ts)

Outcome:
- fragile and visually inconsistent
- dependent on font size and browser rendering details
- not a robust solution

### 6. Tried font-size-based optical nudges in export
Files:
- [export-wysiwyg-pdf.ts](C:/ppdo/ppdo-next/lib/export-wysiwyg-pdf.ts)

Outcome:
- more principled than fixed-pixel nudges
- still heuristic
- still not truly centered

### 7. Tried inner wrapper plus computed top offset from line-height and row slack
Files:
- [export-wysiwyg-pdf.ts](C:/ppdo/ppdo-next/lib/export-wysiwyg-pdf.ts)

Outcome:
- still relied on DOM/CSS line-box behavior
- still did not match the visible glyph center in exported PDF output

### 8. Verified in Incognito
Outcome:
- ruled out cache, localStorage, and draft-state persistence as the cause
- confirmed the problem is deterministic in the export rendering path

## Why the Earlier Fixes Failed
All failed attempts shared the same weakness: they tried to coerce browser DOM text layout into appearing centered after `html2canvas` rasterization.

That approach was not reliable because:

- the category row is a merged-row label rendered as a single text element spanning the full row
- browser text baselines and line boxes are not the same thing as visible glyph center
- `html2canvas` rasterizes the DOM output, so slight baseline bias remains visible
- ordinary data cells happen to look acceptable under the current DOM model, but the merged category label exposes the bias much more clearly

In short, the browser-owned text layout was still in control, and all nudges were compensations layered on top of that.

## Why Incognito Ruled Out Cache or State Issues
The issue reproduced in Incognito after exporting again from a fresh session.

That matters because it eliminates:

- stale cached JavaScript or CSS
- localStorage-based editor draft state
- persisted modal setup state

The bug is therefore tied to render/export math, not stale client state.

## Final Diagnosis
The category row is a merged-row label rendered inside a full-row text element. In the current export pipeline, that label was still going through HTML text layout and then getting rasterized by `html2canvas`.

The dominant failure was not the outer row box. The failure was the browser text baseline inside that row box.

This explains why:

- left alignment could be fixed
- row background could be correct
- data cells could look acceptable
- category labels could still look top-heavy

## Chosen Next Approach
The chosen next approach is to stop using HTML text rendering for category rows during PDF export and instead render category labels onto a dedicated canvas using measured font metrics.

This approach is preferable because:

- it removes dependence on browser DOM text-baseline quirks for category rows
- it uses measured ascent/descent values for actual glyph placement
- it stays scoped to category rows only
- it does not require route-specific logic
- it automatically covers both project and 20% DF category exports

## Acceptance Checklist
- category labels remain left-aligned in exported PDF output
- category labels are visually centered vertically within the category row
- normal header, data, and totals cells remain unchanged
- no route-specific fix is introduced
- project and 20% DF category exports inherit the fix automatically
- the export path no longer depends on DOM/CSS nudges for category-row vertical centering
