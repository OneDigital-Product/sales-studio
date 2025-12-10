"use client";

import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  return "just now";
}

export function OutstandingRequestsWidget() {
  const requests = useQuery(api.info_requests.getAllPendingRequests);

  if (!requests) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Outstanding Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Outstanding Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            description="All information requests have been completed. Great work!"
            icon={CheckCircle}
            title="No Pending Requests"
          />
        </CardContent>
      </Card>
    );
  }

  // Group requests by client
  const groupedByClient = requests.reduce(
    (acc, request) => {
      if (!acc[request.clientId]) {
        acc[request.clientId] = {
          clientName: request.clientName,
          clientId: request.clientId,
          requests: [],
        };
      }
      acc[request.clientId].requests.push(request);
      return acc;
    },
    {} as Record<
      string,
      {
        clientName: string;
        clientId: string;
        requests: typeof requests;
      }
    >
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Outstanding Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.values(groupedByClient).map((group) => (
            <div className="space-y-2" key={group.clientId}>
              <Link
                className="font-medium text-primary hover:underline"
                href={`/clients/${group.clientId}`}
              >
                {group.clientName}
              </Link>
              <div className="space-y-2 pl-4">
                {group.requests.map((request) => {
                  const completedItems = request.items.filter(
                    (item) => item.received
                  ).length;
                  const totalItems = request.items.length;

                  return (
                    <div
                      className="border-yellow-400 border-l-2 py-2 pl-3 text-sm"
                      key={request._id}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">
                          {formatRelativeTime(request.requestedAt)}
                        </span>
                        {request.quoteType && (
                          <Badge className="text-xs" variant="outline">
                            {request.quoteType}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-gray-700">
                        {completedItems}/{totalItems} items completed
                      </div>
                      {request.requestedBy && (
                        <div className="text-gray-500 text-xs">
                          Requested by {request.requestedBy}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
