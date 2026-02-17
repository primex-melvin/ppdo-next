"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    ResizableModal,
    ResizableModalContent,
    ResizableModalHeader,
    ResizableModalFooter,
    ResizableModalTitle,
    ResizableModalDescription,
    ResizableModalBody,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Trash2,
    Building2,
    Folder,
    FileText,
    AlertTriangle,
    Loader2,
    ShieldAlert,
    CheckCircle2,
} from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";
import { formatCurrency } from "@/app/(private)/dashboard/implementing-agencies/page"; // Reuse the one we saw in page.tsx

interface DeleteAgencyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agencyId: Id<"implementingAgencies"> | null;
    onSuccess: () => void;
}

export function DeleteAgencyModal({
    open,
    onOpenChange,
    agencyId,
    onSuccess,
}: DeleteAgencyModalProps) {
    const [pin, setPin] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Skip query if no agencyId
    const previewData = useQuery(
        api.implementingAgencies.getDeletePreview,
        agencyId ? { id: agencyId } : "skip" as any
    );

    const deleteWithCascade = useMutation(api.implementingAgencies.deleteWithCascade);
    const removeAgency = useMutation(api.implementingAgencies.remove); // For safe delete

    // Reset state when opening/closing
    useEffect(() => {
        if (open) {
            setPin("");
            setError(null);
            setIsDeleting(false);
        }
    }, [open, agencyId]);

    if (!open || !agencyId) return null;

    const isLoading = previewData === undefined;
    const hasChildren = previewData?.hasChildren ?? false;

    // Handler for SAFE delete (0 children)
    const handleSafeDelete = async () => {
        try {
            setIsDeleting(true);
            await removeAgency({ id: agencyId });
            toast.success("Agency deleted successfully");
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            toast.error("Failed to delete agency");
            console.error(err);
            setIsDeleting(false);
        }
    };

    // Handler for CRITICAL delete (Has children)
    const handleCriticalDelete = async () => {
        if (pin.length !== 6) {
            setError("Please enter your 6-digit PIN");
            return;
        }

        try {
            setIsDeleting(true);
            setError(null);

            const result = await deleteWithCascade({
                id: agencyId,
                pin: pin,
            });

            if (result.success) {
                toast.success(`Agency and related items deleted successfully`);
                onSuccess();
                onOpenChange(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete agency";
            setError(errorMessage);
            toast.error(errorMessage);
            setIsDeleting(false);
        }
    };

    return (
        <ResizableModal open={open} onOpenChange={onOpenChange}>
            <ResizableModalContent
                width={hasChildren ? 600 : 450} // Wider for critical mode
                maxWidth="95vw"
                className="bg-background border-border"
            >
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">
                            Analyzing agency data...
                        </p>
                    </div>
                )}

                <ResizableModalHeader>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${hasChildren ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                            {hasChildren ? (
                                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                            ) : (
                                <Trash2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div>
                            <ResizableModalTitle className={hasChildren ? "text-red-600 dark:text-red-400" : ""}>
                                {hasChildren ? "Critical Deletion Warning" : "Delete Agency"}
                            </ResizableModalTitle>
                            <ResizableModalDescription>
                                {previewData?.agency.name} ({previewData?.agency.code})
                            </ResizableModalDescription>
                        </div>
                    </div>
                </ResizableModalHeader>

                <ResizableModalBody className="px-6 py-4 space-y-4">
                    {/* SAFE DELETE CONTENT */}
                    {!hasChildren && previewData && (
                        <div className="space-y-4">
                            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle className="text-green-800 dark:text-green-300 font-semibold">Safe to Delete</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    This agency has 0 related projects or breakdowns. It is safe to delete.
                                </AlertDescription>
                            </Alert>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete this agency? This action cannot be undone.
                            </p>
                        </div>
                    )}

                    {/* CRITICAL DELETE CONTENT */}
                    {hasChildren && previewData && (
                        <div className="space-y-5">
                            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-semibold">Destructive Action</AlertTitle>
                                <AlertDescription>
                                    This will permanently delete the agency and all <b>{previewData.totalCount}</b> associated items. This action <b>cannot</b> be undone.
                                </AlertDescription>
                            </Alert>

                            {/* Impact Summary */}
                            <div className="rounded-lg border bg-muted/50 overflow-hidden">
                                <div className="bg-muted px-4 py-2 border-b">
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Items to be Deleted
                                    </h4>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Total Projects/items</p>
                                            <p className="text-2xl font-bold">{previewData.totalCount}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Total Budget Impact</p>
                                            <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
                                                {formatCurrency(previewData.totalBudget)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category Breakdown */}
                                    <div className="border-t pt-3 mt-3">
                                        <p className="text-xs font-semibold mb-2">Breakdown by Type:</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                            {Object.entries(previewData.affectedItems).map(([key, items]) => (
                                                items.length > 0 && (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="font-mono">{items.length}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List Accordion */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border rounded-md px-3 my-2">
                                    <AccordionTrigger className="text-sm py-2 hover:no-underline">
                                        View list of affected items
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 pt-2">
                                            {Object.values(previewData.affectedItems).flat().map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between text-xs border p-2 rounded bg-background">
                                                    <span className="truncate flex-1 font-medium">{item.name}</span>
                                                    <span className="text-muted-foreground ml-2 shrink-0">{item.type}</span>
                                                </div>
                                            ))}
                                            {Object.values(previewData.affectedItems).flat().length === 0 && (
                                                <p className="text-xs text-muted-foreground italic">No items found.</p>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* PIN Verification */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1 text-center">
                                    <label className="text-sm font-medium">
                                        Enter PIN to Confirm Deletion
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Please enter your 6-digit security PIN
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        pattern={REGEXP_ONLY_DIGITS}
                                        value={pin}
                                        onChange={(val) => {
                                            setPin(val);
                                            setError(null);
                                        }}
                                        disabled={isDeleting}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                {error && (
                                    <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </ResizableModalBody>

                <ResizableModalFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>

                    {hasChildren ? (
                        <Button
                            variant="destructive"
                            onClick={handleCriticalDelete}
                            disabled={isDeleting || pin.length !== 6}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting Forever...
                                </>
                            ) : (
                                "Verify & Delete Forever"
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSafeDelete}
                            disabled={isDeleting}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm Delete"
                            )}
                        </Button>
                    )}
                </ResizableModalFooter>
            </ResizableModalContent>
        </ResizableModal>
    );
}
