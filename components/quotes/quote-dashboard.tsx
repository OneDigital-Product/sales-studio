"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Clock, FileDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuoteType>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<Id<"quotes">>>(
    new Set()
  );
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<QuoteStatus>("intake");
  const [bulkNotes, setBulkNotes] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [generatedReport, setGeneratedReport] = useState<{
    quotes: Array<{
      _id: Id<"quotes">;
      clientName: string;
      type: "PEO" | "ACA";
      status: QuoteStatus;
      isBlocked?: boolean;
      blockedReason?: string;
      startedAt?: number;
      completedAt?: number;
      daysToComplete?: number;
    }>;
    summary: {
      totalQuotes: number;
      peoQuotes: number;
      acaQuotes: number;
      acceptedQuotes: number;
      declinedQuotes: number;
      activeQuotes: number;
      blockedQuotes: number;
      avgDaysToComplete?: number;
    };
  } | null>(null);

  const dashboard = useQuery(api.quotes.getQuotesDashboard);
  const batchUpdate = useMutation(api.quotes.batchUpdateQuoteStatus);
  const reportData = useQuery(
    api.quotes.generateQuoteReport,
    showReportDialog && reportStartDate && reportEndDate
      ? {
          startDate: new Date(reportStartDate).getTime(),
          endDate: new Date(reportEndDate).getTime(),
        }
      : showReportDialog
        ? {}
        : "skip"
  );

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

  const handleGenerateReport = () => {
    if (reportData) {
      setGeneratedReport(reportData);
    }
  };

  const handleExportPDF = () => {
    if (!generatedReport) return;

    // Create HTML for PDF export
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote Status Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
            .summary-card p { margin: 0; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: 600; }
            .peo-badge { background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .aca-badge { background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Quote Status Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${reportStartDate ? `<p>Start Date: ${reportStartDate}</p>` : ""}
          ${reportEndDate ? `<p>End Date: ${reportEndDate}</p>` : ""}

          <div class="summary">
            <div class="summary-card">
              <h3>Total Quotes</h3>
              <p>${generatedReport.summary.totalQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>PEO Quotes</h3>
              <p>${generatedReport.summary.peoQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>ACA Quotes</h3>
              <p>${generatedReport.summary.acaQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>Accepted</h3>
              <p style="color: #22c55e">${generatedReport.summary.acceptedQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>Declined</h3>
              <p style="color: #ef4444">${generatedReport.summary.declinedQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>Active</h3>
              <p style="color: #3b82f6">${generatedReport.summary.activeQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>Blocked</h3>
              <p style="color: #f59e0b">${generatedReport.summary.blockedQuotes}</p>
            </div>
            <div class="summary-card">
              <h3>Avg Days to Complete</h3>
              <p>${generatedReport.summary.avgDaysToComplete?.toFixed(1) ?? "N/A"}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Days to Complete</th>
              </tr>
            </thead>
            <tbody>
              ${generatedReport.quotes
                .map(
                  (quote) => `
                <tr>
                  <td>${quote.clientName}</td>
                  <td><span class="${quote.type.toLowerCase()}-badge">${quote.type}</span></td>
                  <td>${quote.status.replace("_", " ").toUpperCase()}</td>
                  <td>${quote.startedAt ? new Date(quote.startedAt).toLocaleDateString() : "—"}</td>
                  <td>${quote.completedAt ? new Date(quote.completedAt).toLocaleDateString() : "—"}</td>
                  <td>${quote.daysToComplete ?? "—"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case "not_started":
        return "text-gray-600";
      case "intake":
        return "text-primary";
      case "underwriting":
        return "text-accent";
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
            <Button onClick={() => setShowReportDialog(true)} variant="outline">
              Generate Report
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
            <p className="font-bold text-2xl text-primary">
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
                                  ? "bg-primary/10 text-foreground"
                                  : "bg-secondary text-foreground"
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

        {/* Generate Report Dialog */}
        <Dialog onOpenChange={setShowReportDialog} open={showReportDialog}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Quote Status Report</DialogTitle>
              <DialogDescription>
                Generate a comprehensive report of quote activity within a date
                range
              </DialogDescription>
            </DialogHeader>

            {generatedReport ? (
              <div className="space-y-4 py-4">
                {/* Summary Statistics */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Total Quotes</p>
                    <p className="font-bold text-xl">
                      {generatedReport.summary.totalQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">PEO</p>
                    <p className="font-bold text-primary text-xl">
                      {generatedReport.summary.peoQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">ACA</p>
                    <p className="font-bold text-accent text-xl">
                      {generatedReport.summary.acaQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Accepted</p>
                    <p className="font-bold text-green-600 text-xl">
                      {generatedReport.summary.acceptedQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Declined</p>
                    <p className="font-bold text-red-600 text-xl">
                      {generatedReport.summary.declinedQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Active</p>
                    <p className="font-bold text-primary text-xl">
                      {generatedReport.summary.activeQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Blocked</p>
                    <p className="font-bold text-orange-600 text-xl">
                      {generatedReport.summary.blockedQuotes}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-gray-600 text-xs">Avg Days</p>
                    <p className="font-bold text-xl">
                      {generatedReport.summary.avgDaysToComplete?.toFixed(1) ??
                        "—"}
                    </p>
                  </div>
                </div>

                {/* Quotes Table */}
                <div className="max-h-[300px] overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedReport.quotes.map((quote) => (
                        <TableRow key={quote._id}>
                          <TableCell className="font-medium">
                            {quote.clientName}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded px-2 py-1 font-medium text-white text-xs ${
                                quote.type === "PEO"
                                  ? "bg-primary"
                                  : "bg-accent"
                              }`}
                            >
                              {quote.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {quote.status.replace("_", " ").toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {quote.startedAt
                              ? new Date(quote.startedAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {quote.completedAt
                              ? new Date(quote.completedAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {quote.daysToComplete ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date (optional)</Label>
                    <Input
                      id="start-date"
                      onChange={(e) => setReportStartDate(e.target.value)}
                      type="date"
                      value={reportStartDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date (optional)</Label>
                    <Input
                      id="end-date"
                      onChange={(e) => setReportEndDate(e.target.value)}
                      type="date"
                      value={reportEndDate}
                    />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  Leave dates blank to include all quotes
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowReportDialog(false);
                  setGeneratedReport(null);
                  setReportStartDate("");
                  setReportEndDate("");
                }}
                variant="outline"
              >
                Close
              </Button>
              {generatedReport ? (
                <Button onClick={handleExportPDF} variant="default">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              ) : (
                <Button
                  disabled={!reportData}
                  onClick={handleGenerateReport}
                  variant="default"
                >
                  {reportData ? "Generate" : "Loading..."}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
