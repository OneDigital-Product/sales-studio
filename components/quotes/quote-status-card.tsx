"use client";

import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  History,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { QuoteProgressBar } from "./quote-progress-bar";
import { QuoteStatusUpdate } from "./quote-status-update";

type QuoteStatus =
  | "not_started"
  | "intake"
  | "underwriting"
  | "proposal_ready"
  | "presented"
  | "accepted"
  | "declined";

type QuoteType = "PEO" | "ACA";

type Quote = {
  _id: Id<"quotes">;
  _creationTime: number;
  clientId: Id<"clients">;
  type: QuoteType;
  status: QuoteStatus;
  isBlocked?: boolean;
  blockedReason?: string;
  assignedTo?: string;
  startedAt?: number;
  completedAt?: number;
  notes?: string;
};

type QuoteStatusCardProps = {
  clientId: Id<"clients">;
  type: QuoteType;
  quote: Quote | null;
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  not_started: "Not Started",
  intake: "Intake",
  underwriting: "Underwriting",
  proposal_ready: "Proposal Ready",
  presented: "Presented",
  accepted: "Accepted",
  declined: "Declined",
};

function getStatusBadgeColor(status: QuoteStatus, isBlocked?: boolean) {
  if (isBlocked) {
    return "bg-red-100 text-red-700";
  }
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700";
    case "declined":
      return "bg-red-100 text-red-700";
    case "not_started":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  return "Just now";
}

function formatStatusChange(previousStatus: string, newStatus: string) {
  const prev = STATUS_LABELS[previousStatus as QuoteStatus] ?? previousStatus;
  const next = STATUS_LABELS[newStatus as QuoteStatus] ?? newStatus;
  return `${prev} → ${next}`;
}

export function QuoteStatusCard({
  clientId,
  type,
  quote,
}: QuoteStatusCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignedName, setAssignedName] = useState("");

  const updateQuoteAssignment = useMutation(api.quotes.updateQuoteAssignment);

  const history = useQuery(
    api.quotes.getQuoteHistory,
    quote ? { quoteId: quote._id } : "skip"
  );

  const status = quote?.status ?? "not_started";
  const isBlocked = quote?.isBlocked ?? false;

  const handleAssignmentSave = async () => {
    if (!quote) return;

    await updateQuoteAssignment({
      quoteId: quote._id,
      assignedTo: assignedName.trim() || undefined,
    });

    setShowAssignDialog(false);
    setAssignedName("");
  };

  const handleAssignClick = () => {
    setAssignedName(quote?.assignedTo ?? "");
    setShowAssignDialog(true);
  };

  // If no quote exists, show create quote card
  if (!quote) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{type} Quote</CardTitle>
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
              Not Created
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <QuoteStatusUpdate
            clientId={clientId}
            currentStatus={null}
            type={type}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={isBlocked ? "border-red-200 bg-red-50/30" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{type} Quote</CardTitle>
            <span
              className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${getStatusBadgeColor(status, isBlocked)}`}
            >
              {isBlocked ? "Blocked" : STATUS_LABELS[status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <QuoteProgressBar status={status} />

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium">{STATUS_LABELS[status]}</span>
            </div>

            {quote?.startedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Started</span>
                <span className="flex items-center gap-1 text-gray-700">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(quote.startedAt)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Assigned</span>
              <button
                className="group flex items-center gap-1 text-gray-700 hover:text-gray-900"
                onClick={handleAssignClick}
                type="button"
              >
                <span>{quote?.assignedTo ?? "—"}</span>
                <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Blocked Reason */}
          {isBlocked && quote?.blockedReason && (
            <div className="flex items-start gap-2 rounded-md bg-red-100 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <div>
                <span className="font-medium text-red-800">Blocked: </span>
                <span className="text-red-700">{quote.blockedReason}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {quote?.notes && !isBlocked && (
            <div className="rounded-md bg-secondary p-3 text-gray-600 text-sm">
              {quote.notes}
            </div>
          )}

          {/* Status Update Button */}
          <QuoteStatusUpdate
            blockedReason={quote?.blockedReason}
            clientId={clientId}
            currentStatus={quote?.status ?? null}
            isBlocked={quote?.isBlocked}
            type={type}
          />

          {/* History Section */}
          {quote && history && history.length > 0 && (
            <div className="border-t pt-3">
              <button
                className="flex w-full items-center justify-between text-gray-500 text-sm hover:text-gray-700"
                onClick={() => setShowHistory(!showHistory)}
                type="button"
              >
                <span>History ({history.length})</span>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2">
                  {history.slice(0, 3).map((entry) => (
                    <div
                      className="flex items-center justify-between text-xs"
                      key={entry._id}
                    >
                      <span className="text-gray-600">
                        {formatStatusChange(
                          entry.previousStatus,
                          entry.newStatus
                        )}
                      </span>
                      <span className="text-gray-400">
                        {formatRelativeTime(entry.changedAt)}
                      </span>
                    </div>
                  ))}
                  {history.length > 3 && (
                    <Button
                      className="mt-2 w-full"
                      onClick={() => setShowFullHistory(true)}
                      size="sm"
                      variant="outline"
                    >
                      <History className="mr-2 h-4 w-4" />
                      View Full History
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog onOpenChange={setShowAssignDialog} open={showAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {type} Quote</DialogTitle>
            <DialogDescription>
              Assign this quote to an analyst. Leave empty to unassign.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="assignedName">Analyst Name</Label>
            <Input
              className="mt-2"
              id="assignedName"
              onChange={(e) => setAssignedName(e.target.value)}
              placeholder="e.g., John Smith"
              value={assignedName}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAssignDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleAssignmentSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full History Dialog */}
      <Dialog onOpenChange={setShowFullHistory} open={showFullHistory}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote History - {type}</DialogTitle>
            <DialogDescription>
              Complete audit trail of all status changes for this quote
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {history && history.length > 0 ? (
              history.map((entry, index) => (
                <div
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                  key={entry._id}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {formatStatusChange(
                          entry.previousStatus,
                          entry.newStatus
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.changedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {entry.changedBy && (
                          <span className="text-gray-600">
                            by {entry.changedBy}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="mt-2 rounded-md bg-secondary p-2 text-gray-700 text-sm">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                    <span className="ml-4 text-gray-400 text-xs">
                      #{history.length - index}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No history available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFullHistory(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
