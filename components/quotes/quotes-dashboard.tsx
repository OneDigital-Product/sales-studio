"use client";

import { useQuery } from "convex/react";
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

type QuoteStatus =
  | "not_started"
  | "intake"
  | "underwriting"
  | "proposal_ready"
  | "presented"
  | "accepted"
  | "declined";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  not_started: "Not Started",
  intake: "Intake",
  underwriting: "Underwriting",
  proposal_ready: "Proposal Ready",
  presented: "Presented",
  accepted: "Accepted",
  declined: "Declined",
};

function getStatusBadgeColor(status: QuoteStatus | null, isBlocked?: boolean) {
  if (isBlocked) {
    return "bg-red-100 text-red-700";
  }
  if (!status) {
    return "bg-gray-100 text-gray-400";
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

function getStatusLabel(status: QuoteStatus | null, isBlocked?: boolean) {
  if (isBlocked) {
    return "Blocked";
  }
  if (status) {
    return STATUS_LABELS[status];
  }
  return "Not Started";
}

function getDotColor(status: QuoteStatus | null, isBlocked?: boolean) {
  if (isBlocked) {
    return "bg-red-500";
  }
  if (status === "accepted") {
    return "bg-green-500";
  }
  if (status === "declined") {
    return "bg-amber-500";
  }
  if (status && status !== "not_started") {
    return "bg-blue-500";
  }
  return "bg-gray-400";
}

function StatusBadge({
  status,
  isBlocked,
}: {
  status: QuoteStatus | null;
  isBlocked?: boolean;
}) {
  const label = getStatusLabel(status, isBlocked);
  const dotColor = getDotColor(status, isBlocked);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs ${getStatusBadgeColor(status, isBlocked)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

export function QuotesDashboard() {
  const dashboardData = useQuery(api.quotes.getQuotesDashboard);

  const [typeFilter, setTypeFilter] = useState<"all" | "PEO" | "ACA">("all");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [blockedOnly, setBlockedOnly] = useState(false);

  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quote Dashboard</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Apply filters
  const filteredData = dashboardData.filter((row) => {
    // Type filter
    if (typeFilter === "PEO" && !row.peoQuote) {
      return false;
    }
    if (typeFilter === "ACA" && !row.acaQuote) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      const peoMatches = row.peoQuote?.status === statusFilter;
      const acaMatches = row.acaQuote?.status === statusFilter;

      if (typeFilter === "PEO" && !peoMatches) {
        return false;
      }
      if (typeFilter === "ACA" && !acaMatches) {
        return false;
      }
      if (typeFilter === "all" && !peoMatches && !acaMatches) {
        return false;
      }
    }

    // Blocked filter
    if (blockedOnly) {
      const peoBlocked = row.peoQuote?.isBlocked;
      const acaBlocked = row.acaQuote?.isBlocked;

      if (typeFilter === "PEO" && !peoBlocked) {
        return false;
      }
      if (typeFilter === "ACA" && !acaBlocked) {
        return false;
      }
      if (typeFilter === "all" && !peoBlocked && !acaBlocked) {
        return false;
      }
    }

    return true;
  });

  // Count active quotes
  const activeCount = dashboardData.filter(
    (row) =>
      (row.peoQuote &&
        row.peoQuote.status !== "not_started" &&
        row.peoQuote.status !== "accepted" &&
        row.peoQuote.status !== "declined") ||
      (row.acaQuote &&
        row.acaQuote.status !== "not_started" &&
        row.acaQuote.status !== "accepted" &&
        row.acaQuote.status !== "declined")
  ).length;

  const blockedCount = dashboardData.filter(
    (row) => row.peoQuote?.isBlocked || row.acaQuote?.isBlocked
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Quote Dashboard</CardTitle>
            <CardDescription>
              {activeCount} active quote{activeCount === 1 ? "" : "s"}
              {blockedCount > 0 && (
                <span className="ml-2 text-red-600">
                  ({blockedCount} blocked)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label
                className="whitespace-nowrap text-sm"
                htmlFor="type-filter"
              >
                Type
              </Label>
              <Select
                onValueChange={(v) => setTypeFilter(v as "all" | "PEO" | "ACA")}
                value={typeFilter}
              >
                <SelectTrigger className="h-8 w-24" id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PEO">PEO</SelectItem>
                  <SelectItem value="ACA">ACA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label
                className="whitespace-nowrap text-sm"
                htmlFor="status-filter"
              >
                Status
              </Label>
              <Select
                onValueChange={(v) => setStatusFilter(v as QuoteStatus | "all")}
                value={statusFilter}
              >
                <SelectTrigger className="h-8 w-32" id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                checked={blockedOnly}
                className="h-4 w-4 rounded border-gray-300"
                onChange={(e) => setBlockedOnly(e.target.checked)}
                type="checkbox"
              />
              Blocked only
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>PEO Status</TableHead>
                <TableHead>ACA Status</TableHead>
                <TableHead className="text-center">Days Open</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => {
                const hasBlockedQuote =
                  row.peoQuote?.isBlocked || row.acaQuote?.isBlocked;

                return (
                  <TableRow
                    className={hasBlockedQuote ? "bg-red-50/50" : ""}
                    key={row.client._id}
                  >
                    <TableCell>
                      <div className="font-medium">{row.client.name}</div>
                      {row.client.contactEmail && (
                        <div className="text-gray-500 text-xs">
                          {row.client.contactEmail}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        isBlocked={row.peoQuote?.isBlocked}
                        status={row.peoQuote?.status ?? null}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        isBlocked={row.acaQuote?.isBlocked}
                        status={row.acaQuote?.status ?? null}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {row.daysOpen > 0 ? row.daysOpen : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${row.client._id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-gray-500"
                    colSpan={5}
                  >
                    No quotes match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
