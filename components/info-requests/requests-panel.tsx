"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Bell, CheckCircle2, Clock, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Simple relative time formatter
const formatRelativeTime = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

// Format duration between two timestamps
const formatDuration = (startTime: number, endTime: number) => {
  const milliseconds = endTime - startTime;
  const seconds = Math.floor(milliseconds / 1000);

  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
};

interface RequestsPanelProps {
  clientId: Id<"clients">;
}

const REQUEST_STATUS_LABELS = {
  pending: "Pending",
  received: "Received",
  cancelled: "Cancelled",
} as const;

export function RequestsPanel({ clientId }: RequestsPanelProps) {
  const [viewMode, setViewMode] = useState<"outstanding" | "history">(
    "outstanding"
  );
  const requests = useQuery(api.info_requests.getInfoRequests, { clientId });
  const markItemReceived = useMutation(api.info_requests.markItemReceived);
  const markItemNotReceived = useMutation(
    api.info_requests.markItemNotReceived
  );
  const cancelRequest = useMutation(api.info_requests.cancelInfoRequest);
  const sendReminder = useMutation(api.info_requests.sendReminder);

  if (!requests) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const outstandingRequests = requests.filter((r) => r.status !== "cancelled");
  const displayedRequests =
    viewMode === "outstanding" ? outstandingRequests : requests;

  const handleToggleItem = async (
    requestId: Id<"info_requests">,
    itemIndex: number,
    checked: boolean
  ) => {
    if (checked) {
      await markItemReceived({ requestId, itemIndex });
      return;
    }
    await markItemNotReceived({ requestId, itemIndex });
  };

  const handleCancelRequest = async (requestId: Id<"info_requests">) => {
    if (confirm("Are you sure you want to cancel this request?")) {
      await cancelRequest({ requestId });
    }
  };

  const handleSendReminder = async (requestId: Id<"info_requests">) => {
    await sendReminder({ requestId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Information Requests</span>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <Badge variant="secondary">
                {pendingRequests.length} pending
              </Badge>
            )}
            <div className="flex rounded-md border">
              <Button
                className="rounded-r-none"
                onClick={() => setViewMode("outstanding")}
                size="sm"
                variant={viewMode === "outstanding" ? "default" : "ghost"}
              >
                Outstanding
              </Button>
              <Button
                className="rounded-l-none"
                onClick={() => setViewMode("history")}
                size="sm"
                variant={viewMode === "history" ? "default" : "ghost"}
              >
                All History
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedRequests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p>No information requests</p>
            <p className="mt-1 text-sm">
              All required information has been received.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRequests.map((request) => {
              const receivedCount = request.items.filter(
                (item) => item.received
              ).length;
              const totalCount = request.items.length;
              const progress = (receivedCount / totalCount) * 100;
              const displayTitle =
                request.title ??
                `${request.quoteType ? `${request.quoteType} Quote` : "General"} Information Request`;

              return (
                <div
                  className={`rounded-lg border p-4 ${
                    request.status === "pending"
                      ? "border-yellow-200 bg-yellow-50"
                      : request.status === "received"
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                  key={request._id}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {request.status === "pending" ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : request.status === "received" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="break-words font-medium text-sm">
                          {displayTitle}
                        </span>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "default"
                              : request.status === "received"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {REQUEST_STATUS_LABELS[request.status]}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Requested {formatRelativeTime(request.requestedAt)}
                        {request.requestedBy && ` by ${request.requestedBy}`}
                      </div>
                      {request.reminderSentAt && (
                        <div className="mt-1 flex items-center gap-1 text-primary text-xs">
                          <Bell className="h-3 w-3" />
                          <span>
                            Reminder sent{" "}
                            {formatRelativeTime(request.reminderSentAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="font-medium text-sm">
                        {receivedCount}/{totalCount} items
                      </div>
                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleSendReminder(request._id)}
                            size="icon-sm"
                            title="Send reminder"
                            variant="ghost"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleCancelRequest(request._id)}
                            size="icon-sm"
                            title="Cancel request"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-3 rounded border bg-white p-2 text-muted-foreground text-sm">
                      {request.notes}
                    </div>
                  )}

                  <div className="space-y-1">
                    {request.items.map((item, index) => (
                      <div
                        className="flex items-start gap-3 rounded-md bg-white/70 px-3 py-2"
                        key={index}
                      >
                        <Checkbox
                          checked={item.received}
                          disabled={request.status === "cancelled"}
                          onCheckedChange={(checked) =>
                            handleToggleItem(request._id, index, checked)
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className={`break-words text-sm ${item.received ? "text-muted-foreground line-through" : ""}`}
                          >
                            {item.description}
                          </div>
                          {item.category && (
                            <div className="mt-0.5 text-muted-foreground text-xs">
                              {item.category}
                            </div>
                          )}
                          {item.receivedAt && (
                            <div className="mt-1 text-green-600 text-xs">
                              Received {formatRelativeTime(item.receivedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {request.status === "pending" && (
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {request.status === "received" && request.resolvedAt && (
                    <div className="mt-3 text-right text-green-600 text-xs">
                      <div>
                        Completed {formatRelativeTime(request.resolvedAt)}
                      </div>
                      <div className="mt-1 font-medium">
                        Response time:{" "}
                        {formatDuration(
                          request.requestedAt,
                          request.resolvedAt
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
