"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const COPY_RESET_DELAY_MS = 2000;

interface AipRefCodeCellProps {
    value?: string | null;
    className?: string;
}

export function AipRefCodeCell({ value, className }: AipRefCodeCellProps) {
    const [isCopied, setIsCopied] = useState(false);
    const resetTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);

    if (!value || value === "-") {
        return <span className="text-zinc-400">-</span>;
    }

    const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!navigator.clipboard?.writeText) {
            console.error("Clipboard API is not available.");
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);

            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }

            resetTimeoutRef.current = window.setTimeout(() => {
                setIsCopied(false);
                resetTimeoutRef.current = null;
            }, COPY_RESET_DELAY_MS);
        } catch (error) {
            console.error("Failed to copy AIP Ref. Code:", error);
        }
    };

    const stopPointerPropagation = (e: React.SyntheticEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className={cn("group flex items-center gap-2 max-w-full", className)}>
            <span className="min-w-0 truncate text-xs" title={value}>
                {value}
            </span>

            <button
                type="button"
                aria-label="Copy AIP Ref. Code"
                onMouseDown={stopPointerPropagation}
                onPointerDown={stopPointerPropagation}
                onClick={handleCopy}
                className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40",
                    isCopied
                        ? "opacity-100 text-emerald-400 ring-1 ring-emerald-500/60 bg-emerald-500/10"
                        : "opacity-0 group-hover:opacity-60 group-focus-within:opacity-100 hover:opacity-100 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                )}
                title={isCopied ? "Copied" : "Copy AIP Ref. Code"}
            >
                {isCopied ? (
                    <ClipboardCheck className="h-3.5 w-3.5" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
            </button>
        </div>
    );
}
