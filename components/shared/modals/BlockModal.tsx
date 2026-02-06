// app/dashboard/components/BlockModal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface BlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userId?: string;
  onConfirm: (type: "ip" | "email", reason: string) => Promise<void>;
}

export function BlockModal({
  open,
  onOpenChange,
  userName,
  userEmail,
  ipAddress,
  userId,
  onConfirm,
}: BlockModalProps) {
  const [blockType, setBlockType] = useState<"ip" | "email">("ip");
  const [blockReason, setBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!blockReason.trim()) {
      toast.error("Please enter a reason for blocking");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(blockType, blockReason);
      setBlockReason("");
      setBlockType("ip");
    } catch (error) {
      console.error("Block failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setBlockReason("");
        setBlockType("ip");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Block Access</DialogTitle>
          <DialogDescription>
            Choose what to block and provide a reason for this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {userName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {userEmail}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-mono">
              IP: {ipAddress}
            </p>
          </div>

          {/* Block Type Selection */}
          <div className="space-y-2">
            <Label>Block Type</Label>
            <RadioGroup
              value={blockType}
              onValueChange={(v) => setBlockType(v as "ip" | "email")}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ip" id="type-ip" />
                <Label htmlFor="type-ip" className="cursor-pointer font-normal">
                  Block IP Address ({ipAddress})
                </Label>
              </div>
              {userId && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="type-email" />
                  <Label htmlFor="type-email" className="cursor-pointer font-normal">
                    Block Email ({userEmail})
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Blocking</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this block..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Blocking..." : "Confirm Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
