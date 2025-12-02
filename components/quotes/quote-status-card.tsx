"use client";

import { useQuery } from "convex/react";
import { AlertCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      return "bg-amber-100 text-amber-700";
    case "not_started":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-blue-100 text-blue-700";
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

  const history = useQuery(
    api.quotes.getQuoteHistory,
    quote ? { quoteId: quote._id } : "skip"
  );

  const status = quote?.status ?? "not_started";
  const isBlocked = quote?.isBlocked ?? false;

  return (
    <Card className={isBlocked ? "border-red-200 bg-red-50/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{type} Quote</CardTitle>
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
            <span className="text-gray-700">{quote?.assignedTo ?? "—"}</span>
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
          <div className="rounded-md bg-gray-50 p-3 text-gray-600 text-sm">
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
                {history.slice(0, 5).map((entry) => (
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
                {history.length > 5 && (
                  <p className="text-center text-gray-400 text-xs">
                    +{history.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
