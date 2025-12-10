"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type QuoteType = "PEO" | "ACA" | "all";

export function QuoteDashboard() {
  const dashboard = useQuery(api.quotes.getQuotesDashboard);
  const batchUpdate = useMutation(api.quotes.batchUpdateQuoteStatus);

  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuoteType>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<Id<"quotes">>>(
    new Set()
  );
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<QuoteStatus>("intake");
  const [bulkNotes, setBulkNotes] = useState("");

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Transform dashboard data into flat list of quotes
  const allQuotes = dashboard.flatMap((item) => {
    const quotes = [];
    if (item.peoQuote) {
      quotes.push({
        clientId: item.client._id,
        clientName: item.client.name,
        quoteId: item.peoQuote._id,
        type: "PEO" as const,
        status: item.peoQuote.status,
        isBlocked: item.peoQuote.isBlocked ?? false,
        blockedReason: item.peoQuote.blockedReason,
        daysOpen: item.daysOpen,
        startedAt: item.peoQuote.startedAt,
        completedAt: item.peoQuote.completedAt,
      });
    }
    if (item.acaQuote) {
      quotes.push({
        clientId: item.client._id,
        clientName: item.client.name,
        quoteId: item.acaQuote._id,
        type: "ACA" as const,
        status: item.acaQuote.status,
        isBlocked: item.acaQuote.isBlocked ?? false,
        blockedReason: item.acaQuote.blockedReason,
        daysOpen: item.daysOpen,
        startedAt: item.acaQuote.startedAt,
        completedAt: item.acaQuote.completedAt,
      });
    }
    return quotes;
  });

  // Apply filters
  const filteredQuotes = allQuotes.filter((quote) => {
    if (statusFilter !== "all" && quote.status !== statusFilter) return false;
    if (typeFilter !== "all" && quote.type !== typeFilter) return false;
    if (blockedOnly && !quote.isBlocked) return false;
    return true;
  });

  // Group by status
  const groupedByStatus = filteredQuotes.reduce(
    (acc, quote) => {
      if (!acc[quote.status]) {
        acc[quote.status] = [];
      }
      acc[quote.status].push(quote);
      return acc;
    },
    {} as Record<string, typeof filteredQuotes>
  );

  const handleSelectQuote = (quoteId: Id<"quotes">, checked: boolean) => {
    const newSelected = new Set(selectedQuotes);
    if (checked) {
      newSelected.add(quoteId);
    } else {
      newSelected.delete(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredQuotes.map((q) => q.quoteId);
      setSelectedQuotes(new Set(allIds));
    } else {
      setSelectedQuotes(new Set());
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedQuotes.size === 0) return;

    await batchUpdate({
      quoteIds: Array.from(selectedQuotes),
      status: bulkStatus,
      notes: bulkNotes || undefined,
    });

    setSelectedQuotes(new Set());
    setShowBulkDialog(false);
    setBulkNotes("");
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case "not_started":
        return "text-gray-600";
      case "intake":
        return "text-blue-600";
      case "underwriting":
        return "text-purple-600";
      case "proposal_ready":
        return "text-orange-600";
      case "presented":
        return "text-teal-600";
      case "accepted":
        return "text-green-600";
      case "declined":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const color = getStatusColor(status);
    return (
      <span className={`font-medium ${color}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getStatusIcon = (status: QuoteStatus) => {
    if (status === "accepted") {
      return <CheckCircle2 className="mr-1 inline h-4 w-4 text-green-600" />;
    }
    if (status === "declined") {
      return <AlertCircle className="mr-1 inline h-4 w-4 text-red-600" />;
    }
    return <Clock className="mr-1 inline h-4 w-4 text-gray-600" />;
  };

  const formatTimeToCompletion = (startedAt?: number, completedAt?: number) => {
    if (!(startedAt && completedAt)) return null;

    const diff = completedAt - startedAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    return hours > 0 ? `${hours}h` : "< 1h";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Dashboard</CardTitle>
        <CardDescription>
          View and track all active quotes across all clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters and Bulk Actions */}
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Status
            </label>
            <Select
              onValueChange={(value) =>
                setStatusFilter(value as QuoteStatus | "all")
              }
              value={statusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="intake">Intake</SelectItem>
                <SelectItem value="underwriting">Underwriting</SelectItem>
                <SelectItem value="proposal_ready">Proposal Ready</SelectItem>
                <SelectItem value="presented">Presented</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Quote Type
            </label>
            <Select
              onValueChange={(value) => setTypeFilter(value as QuoteType)}
              value={typeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PEO">PEO Only</SelectItem>
                <SelectItem value="ACA">ACA Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={() => setBlockedOnly(!blockedOnly)}
              variant={blockedOnly ? "default" : "outline"}
            >
              {blockedOnly ? "Showing Blocked" : "Show Blocked Only"}
            </Button>
            {selectedQuotes.size > 0 && (
              <Button onClick={() => setShowBulkDialog(true)} variant="default">
                Bulk Update Status ({selectedQuotes.size})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-gray-600 text-sm">Total Quotes</p>
            <p className="font-bold text-2xl">{filteredQuotes.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-gray-600 text-sm">Blocked Quotes</p>
            <p className="font-bold text-2xl text-red-600">
              {filteredQuotes.filter((q) => q.isBlocked).length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-gray-600 text-sm">Active Quotes</p>
            <p className="font-bold text-2xl text-blue-600">
              {
                filteredQuotes.filter(
                  (q) => !["accepted", "declined"].includes(q.status)
                ).length
              }
            </p>
          </div>
        </div>

        {/* Quotes Table */}
        {Object.keys(groupedByStatus).length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">
              No quotes match the current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByStatus).map(([status, quotes]) => (
              <div key={status}>
                <h3 className="mb-3 flex items-center font-semibold text-gray-900 text-lg">
                  {getStatusIcon(status as QuoteStatus)}
                  {status.replace("_", " ").toUpperCase()} ({quotes.length})
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              quotes.length > 0 &&
                              quotes.every((q) => selectedQuotes.has(q.quoteId))
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newSelected = new Set(selectedQuotes);
                                for (const q of quotes) {
                                  newSelected.add(q.quoteId);
                                }
                                setSelectedQuotes(newSelected);
                              } else {
                                const newSelected = new Set(selectedQuotes);
                                for (const q of quotes) {
                                  newSelected.delete(q.quoteId);
                                }
                                setSelectedQuotes(newSelected);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Blocked Reason</TableHead>
                        <TableHead>Days Open</TableHead>
                        <TableHead>Time to Complete</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow
                          className={quote.isBlocked ? "bg-red-50" : ""}
                          key={`${quote.clientId}-${quote.type}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedQuotes.has(quote.quoteId)}
                              onCheckedChange={(checked) =>
                                handleSelectQuote(
                                  quote.quoteId,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {quote.clientName}
                            {quote.isBlocked && (
                              <span className="ml-2 rounded bg-red-100 px-2 py-1 font-normal text-red-800 text-xs">
                                BLOCKED
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded px-2 py-1 font-medium text-xs ${
                                quote.type === "PEO"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {quote.type}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(quote.status)}</TableCell>
                          <TableCell>
                            {quote.blockedReason ? (
                              <span className="text-gray-700 text-sm">
                                {quote.blockedReason}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {quote.daysOpen > 0 ? (
                              <span
                                className={
                                  quote.daysOpen > 30
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }
                              >
                                {quote.daysOpen} days
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatTimeToCompletion(
                              quote.startedAt,
                              quote.completedAt
                            ) ? (
                              <span className="text-gray-700">
                                {formatTimeToCompletion(
                                  quote.startedAt,
                                  quote.completedAt
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/clients/${quote.clientId}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Update Dialog */}
        <Dialog onOpenChange={setShowBulkDialog} open={showBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Update Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedQuotes.size} selected quote
                {selectedQuotes.size === 1 ? "" : "s"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="font-medium text-sm">New Status</label>
                <Select
                  onValueChange={(value) => setBulkStatus(value as QuoteStatus)}
                  value={bulkStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="underwriting">Underwriting</SelectItem>
                    <SelectItem value="proposal_ready">
                      Proposal Ready
                    </SelectItem>
                    <SelectItem value="presented">Presented</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm">Notes (optional)</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  value={bulkNotes}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowBulkDialog(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleBulkUpdate}>Apply Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
