/**
 * Print adapters for converting table data to print-ready format
 * Handles transformation of table data (with categories, filtering, etc.) 
 * into the canonical shape expected by PrintPreviewModal
 */

import { TwentyPercentDF as Project, GroupedTwentyPercentDF as GroupedProjects, ProjectCategory } from '../types';
import { ColumnDefinition, RowMarker } from '@/lib/print-canvas/types';
import { AVAILABLE_COLUMNS } from '../constants';

/**
 * Result of preparing projects for print
 */
export interface PrintProjectsData {
    flatItems: Project[];
    rowMarkers: RowMarker[];
}

/**
 * Flattens grouped projects into a single array with category row markers
 * 
 * @param groupedProjects - Projects grouped by category
 * @returns Flat items array and row markers indicating category positions
 */
export function flattenGroupedTwentyPercentDFForPrint(
    groupedProjects: GroupedProjects[]
): PrintProjectsData {
    const flatItems: Project[] = [];
    const rowMarkers: RowMarker[] = [];

    for (const group of groupedProjects) {
        // Skip empty categories
        if (!group.projects || group.projects.length === 0) {
            continue;
        }

        // Record the position of this category header
        const categoryLabel = group.category?.fullName || group.category?.code || 'Uncategorized';
        const categoryId = group.category?._id;

        rowMarkers.push({
            index: flatItems.length,
            type: 'category',
            label: categoryLabel,
            categoryId,
        });

        // Add all projects from this group
        flatItems.push(...group.projects);
    }

    return { flatItems, rowMarkers };
}

/**
 * Maps project table columns to print column definitions
 * Ensures consistency between UI columns and print output
 * 
 * @param hiddenColumns - Set of column keys that should not be printed
 * @returns Array of visible column definitions
 */
export function getTwentyPercentDFPrintColumns(hiddenColumns: Set<string>): ColumnDefinition[] {
    const allColumns: ColumnDefinition[] = AVAILABLE_COLUMNS.map((column) => ({
        key: column.id,
        label: column.label,
        align: column.align || 'left',
        printVariant: column.printVariant,
        widthWeight: column.widthWeight,
        compactWidthWeight: column.compactWidthWeight,
        minWidth: column.minWidth,
        compactMinWidth: column.compactMinWidth,
    }));

    return allColumns.filter(col => !hiddenColumns.has(col.key));
}
