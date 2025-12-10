"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface RequestsPanelProps {
  clientId: Id<"clients">;
}

export function RequestsPanel({ clientId }: RequestsPanelProps) {
  const requests = useQuery(api.info_requests.getInfoRequests, { clientId });
  const markItemReceived = useMutation(api.info_requests.markItemReceived);
  const markItemNotReceived = useMutation(
    api.info_requests.markItemNotReceived
  );

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

  const handleToggleItem = async (
    requestId: Id<"info_requests">,
    itemIndex: number,
    currentlyReceived: boolean
  ) => {
    if (currentlyReceived) {
      await markItemNotReceived({ requestId, itemIndex });
    } else {
      await markItemReceived({ requestId, itemIndex });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Outstanding Requests</span>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">{pendingRequests.length} pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p>No information requests</p>
            <p className="mt-1 text-sm">
              All required information has been received.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const receivedCount = request.items.filter(
                (item) => item.received
              ).length;
              const totalCount = request.items.length;
              const progress = (receivedCount / totalCount) * 100;

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
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {request.status === "pending" ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : request.status === "received" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium text-sm">
                          {request.quoteType
                            ? `${request.quoteType} Quote`
                            : "General"}{" "}
                          Information Request
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
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Requested {formatRelativeTime(request.requestedAt)}
                        {request.requestedBy && ` by ${request.requestedBy}`}
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      {receivedCount}/{totalCount} items
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-3 rounded border bg-white p-2 text-muted-foreground text-sm">
                      {request.notes}
                    </div>
                  )}

                  <div className="space-y-2">
                    {request.items.map((item, index) => (
                      <div
                        className="flex items-start gap-3 rounded border bg-white p-3"
                        key={index}
                      >
                        <Checkbox
                          checked={item.received}
                          disabled={request.status !== "pending"}
                          onCheckedChange={() =>
                            handleToggleItem(request._id, index, item.received)
                          }
                        />
                        <div className="flex-1">
                          <div
                            className={`text-sm ${item.received ? "text-muted-foreground line-through" : ""}`}
                          >
                            {item.description}
                          </div>
                          {item.category && (
                            <div className="mt-1 text-muted-foreground text-xs">
                              Category: {item.category}
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
                      Completed {formatRelativeTime(request.resolvedAt)}
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
