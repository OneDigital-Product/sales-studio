"use client";

import { useQuery } from "convex/react";
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
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuoteType>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);

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
        daysOpen: item.daysOpen,
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
        daysOpen: item.daysOpen,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Dashboard</CardTitle>
        <CardDescription>
          View and track all active quotes across all clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
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

          <div className="flex items-end">
            <Button
              onClick={() => setBlockedOnly(!blockedOnly)}
              variant={blockedOnly ? "default" : "outline"}
            >
              {blockedOnly ? "Showing Blocked" : "Show Blocked Only"}
            </Button>
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
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Days Open</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow
                          className={quote.isBlocked ? "bg-red-50" : ""}
                          key={`${quote.clientId}-${quote.type}`}
                        >
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
      </CardContent>
    </Card>
  );
}
