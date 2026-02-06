
"use client";

import { cn } from "@/lib/utils";

interface TextCellProps {
    value: string | undefined | null;
    align?: "left" | "right" | "center";
    className?: string;
    truncate?: boolean;
    title?: string;
}

export function TextCell({
    value,
    align = "left",
    className,
    truncate = true,
    title
}: TextCellProps) {
    if (!value) {
        return <span className="text-zinc-400">-</span>;
    }

    return (
        <div
            className={cn(
                "w-full text-xs",
                align === "center" && "text-center",
                align === "right" && "text-right",
                align === "left" && "text-left",
                truncate && "truncate",
                className
            )}
            title={title || value}
        >
            {value}
        </div>
    );
}
