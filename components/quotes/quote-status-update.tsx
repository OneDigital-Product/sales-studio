"use client";

import { useMutation } from "convex/react";
import { ChevronDown } from "lucide-react";
import { ResultAsync } from "neverthrow";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type QuoteStatus =
  | "not_started"
  | "intake"
  | "underwriting"
  | "proposal_ready"
  | "presented"
  | "accepted"
  | "declined";

type QuoteType = "PEO" | "ACA";

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "intake", label: "Intake" },
  { value: "underwriting", label: "Underwriting" },
  { value: "proposal_ready", label: "Proposal Ready" },
  { value: "presented", label: "Presented" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

type QuoteStatusUpdateProps = {
  clientId: Id<"clients">;
  type: QuoteType;
  currentStatus: QuoteStatus | null;
  isBlocked?: boolean;
  blockedReason?: string;
};

export function QuoteStatusUpdate({
  clientId,
  type,
  currentStatus,
  isBlocked,
  blockedReason,
}: QuoteStatusUpdateProps) {
  const updateQuoteStatus = useMutation(api.quotes.updateQuoteStatus);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [blocked, setBlocked] = useState(isBlocked ?? false);
  const [blockReason, setBlockReason] = useState(blockedReason ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusSelect = (status: QuoteStatus) => {
    setSelectedStatus(status);
    setBlocked(false);
    setBlockReason("");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleSetBlocked = () => {
    setSelectedStatus(currentStatus);
    setBlocked(true);
    setBlockReason(blockedReason ?? "");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const statusToSet = selectedStatus ?? currentStatus ?? "not_started";
    setIsSubmitting(true);

    const result = await ResultAsync.fromPromise(
      updateQuoteStatus({
        clientId,
        type,
        status: statusToSet,
        isBlocked: blocked,
        blockedReason: blocked ? blockReason : undefined,
        notes: notes || undefined,
      }),
      (error) => error
    );

    result.match(
      () => {
        setIsDialogOpen(false);
        setSelectedStatus(null);
        setNotes("");
        setBlocked(false);
        setBlockReason("");
      },
      () => {
        // Error handled silently
      }
    );

    setIsSubmitting(false);
  };

  const currentLabel =
    STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label ??
    "Not Started";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full justify-between"
            size="sm"
            variant="outline"
          >
            {currentStatus ? "Update Status" : "Start Quote"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Set Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              className={currentStatus === option.value ? "bg-accent" : ""}
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleSetBlocked}
          >
            {isBlocked ? "Update Block Reason" : "Mark as Blocked"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blocked
                ? "Mark Quote as Blocked"
                : `Update ${type} Quote Status`}
            </DialogTitle>
            <DialogDescription>
              {blocked
                ? "Provide a reason why this quote is blocked."
                : `Change status from "${currentLabel}" to "${STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label ?? ""}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {blocked && (
              <div className="space-y-2">
                <Label htmlFor="blockReason">Block Reason</Label>
                <Textarea
                  id="blockReason"
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Missing census data, waiting on client..."
                  value={blockReason}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context..."
                value={notes}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || (blocked && !blockReason.trim())}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
