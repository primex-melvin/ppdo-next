
"use client";

import { ReactNode } from "react";

interface ResizableTableContainerProps {
    children: ReactNode;
    toolbar?: ReactNode;
    className?: string;
    /** Maximum height for scrollable area */
    maxHeight?: string;
}

/**
 * Google Sheets-style table container:
 * - Fits exactly to table content (no extra space)
 * - Scrolls when content exceeds max dimensions
 * - Sticky header/footer during scroll
 */
export function ResizableTableContainer({
    children,
    toolbar,
    className = "",
    maxHeight = "calc(100vh - 280px)",
}: ResizableTableContainerProps) {
    return (
        <div
            className={`inline-block bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden ${className}`}
            style={{
                borderColor: 'rgb(228 228 231 / 1)',
                maxWidth: '100%',
            }}
        >
            {toolbar}

            <div
                className="overflow-auto border-t border-zinc-200 dark:border-zinc-800"
                style={{
                    maxHeight,
                    maxWidth: 'calc(100vw - 300px)', // Account for sidebar
                }}
            >
                {children}
            </div>
        </div>
    );
}
