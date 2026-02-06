
"use client";

import { ReactNode } from "react";

interface ResizableTableContainerProps {
    children: ReactNode;
    toolbar?: ReactNode;
    className?: string;
    height?: string;
}

export function ResizableTableContainer({
    children,
    toolbar,
    className = "",
    height = "h-[calc(100vh-200px)]",
}: ResizableTableContainerProps) {
    return (
        <div
            className={`flex flex-col bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden min-h-[500px] ${height} ${className}`}
            style={{
                borderColor: 'rgb(228 228 231 / 1)',
            }}
        >
            {toolbar}

            <div className="flex-1 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
                {children}
            </div>
        </div>
    );
}
