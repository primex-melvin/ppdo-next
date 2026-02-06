
"use client";

import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";

interface RemarksCellProps {
    remarks?: string;
}

export function RemarksCell({ remarks }: RemarksCellProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!remarks) {
        return <span className="text-zinc-400">-</span>;
    }

    // If remarks are short, just display them
    if (remarks.length < 30) {
        return <span className="truncate" title={remarks}>{remarks}</span>;
    }

    return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="truncate max-w-[120px] text-xs">{remarks}</span>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <MessageSquareText className="h-3 w-3 text-zinc-500" />
                        <span className="sr-only">View full remarks</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-xs p-3" align="end">
                    <p className="whitespace-pre-wrap">{remarks}</p>
                </PopoverContent>
            </Popover>
        </div>
    );
}
