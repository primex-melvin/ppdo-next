
"use client";

interface FundRemarksCellProps {
    remarks: string | undefined | null;
}

export function FundRemarksCell({ remarks }: FundRemarksCellProps) {
    return (
        <div className="w-full truncate text-xs text-zinc-500 dark:text-zinc-400" title={remarks || ""}>
            {remarks || "-"}
        </div>
    );
}
