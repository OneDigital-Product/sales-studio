"use client";

import { useQuery } from "convex/react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
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

export function StatisticsWidget() {
  const stats = useQuery(api.statistics.getSystemStatistics, {});

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const monthlyReport = useQuery(api.statistics.getMonthlyActivityReport, {
    month: selectedMonth,
    year: selectedYear,
  });

  const generatePDF = () => {
    if (!monthlyReport) return;

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[selectedMonth - 1];

    const content = `
SALES STUDIO - MONTHLY ACTIVITY REPORT
${monthName} ${selectedYear}

========================================

ACTIVITY SUMMARY

Clients Created:         ${monthlyReport.clientsCreated}
Files Uploaded:          ${monthlyReport.filesUploaded}
Census Uploads:          ${monthlyReport.censusUploads}

QUOTE ACTIVITY

Quotes Completed:        ${monthlyReport.quotesCompleted}
  - Accepted:            ${monthlyReport.quotesAccepted}
  - Declined:            ${monthlyReport.quotesDeclined}

INFORMATION REQUESTS

Requests Created:        ${monthlyReport.infoRequestsCreated}
Requests Resolved:       ${monthlyReport.infoRequestsResolved}

========================================
Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    toast.textContent = "Report downloaded successfully";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
    },
    {
      title: "Active Quotes",
      value: stats.activeQuotes,
      icon: TrendingUp,
    },
    {
      title: "Completed Quotes",
      value: stats.completedQuotes,
      icon: CheckCircle2,
    },
    {
      title: "Avg Quote Time",
      value: `${stats.averageQuoteCompletionTime} days`,
      icon: Clock,
    },
    {
      title: "Avg Data Quality",
      value: `${stats.averageDataQualityScore}%`,
      icon: BarChart3,
    },
    {
      title: "Census Uploads",
      value: stats.totalCensusUploads,
      icon: FileText,
    },
    {
      title: "Total Files",
      value: stats.totalFiles,
      icon: FileText,
    },
    {
      title: "Active Info Requests",
      value: stats.activeInfoRequests,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats - Using Table for consistency */}
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead className="rounded-tl-lg pl-6">Metric</TableHead>
                <TableHead className="rounded-tr-lg pr-6 text-right">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <TableRow key={stat.title}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{stat.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium">
                      {stat.value}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-base text-primary">Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  Quote Completion Rate
                </TableCell>
                <TableCell className="pr-6 text-right font-medium">
                  {stats.activeQuotes + stats.completedQuotes > 0
                    ? Math.round(
                        (stats.completedQuotes /
                          (stats.activeQuotes + stats.completedQuotes)) *
                          100
                      )
                    : 0}
                  %
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  Avg Files Per Client
                </TableCell>
                <TableCell className="pr-6 text-right font-medium">
                  {stats.totalClients > 0
                    ? Math.round((stats.totalFiles / stats.totalClients) * 10) /
                      10
                    : 0}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6 text-muted-foreground">
                  Clients with Census Data
                </TableCell>
                <TableCell className="pr-6 text-right font-medium">
                  {stats.totalCensusUploads > 0
                    ? Math.min(stats.totalCensusUploads, stats.totalClients)
                    : 0}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Activity Report */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base text-primary">
                Monthly Activity Report
              </CardTitle>
              <CardDescription className="mt-1">
                View activity metrics for a specific month
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) => setSelectedMonth(Number(value))}
                value={String(selectedMonth)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => setSelectedYear(Number(value))}
                value={String(selectedYear)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={!monthlyReport} onClick={generatePDF} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {monthlyReport ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Activity</TableHead>
                  <TableHead className="pr-6 text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Clients Created</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.clientsCreated}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Files Uploaded</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.filesUploaded}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>Census Uploads</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.censusUploads}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Quotes Completed</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.quotesCompleted}
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({monthlyReport.quotesAccepted} accepted,{" "}
                      {monthlyReport.quotesDeclined} declined)
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Info Requests Created</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.infoRequestsCreated}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Info Requests Resolved</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {monthlyReport.infoRequestsResolved}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
