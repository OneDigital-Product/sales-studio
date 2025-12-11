"use client";

import { useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <AlertCircle className="h-4 w-4" />
            Outstanding Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <AlertCircle className="h-4 w-4" />
            Outstanding Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <EmptyState
            description="All information requests have been completed."
            icon={CheckCircle}
            title="No Pending Requests"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-primary">
            <AlertCircle className="h-4 w-4" />
            Outstanding Requests
          </CardTitle>
          <Badge variant="secondary">{requests.length}</Badge>
        </div>
        <CardDescription>
          Pending information requests by client
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Client</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="pr-6 text-right">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const completedItems = request.items.filter(
                (item) => item.received
              ).length;
              const totalItems = request.items.length;

              return (
                <TableRow key={request._id}>
                  <TableCell className="pl-6">
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/clients/${request.clientId}`}
                    >
                      {request.clientName}
                    </Link>
                    {request.requestedBy && (
                      <p className="text-gray-500 text-xs">
                        by {request.requestedBy}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 text-sm">
                      {completedItems}/{totalItems} items
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(request.requestedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {request.quoteType && (
                      <Badge className="text-xs" variant="outline">
                        {request.quoteType}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
