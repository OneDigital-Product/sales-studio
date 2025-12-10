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
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";

export default function StatisticsPage() {
  const stats = useQuery(api.statistics.getSystemStatistics, {});

  // Monthly report state
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

    // Create PDF content as text
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

    // Create a blob with the content
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success notification
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    toast.textContent = "Report downloaded successfully";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (!stats) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading statistics...</div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Quotes",
      value: stats.activeQuotes,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Completed Quotes",
      value: stats.completedQuotes,
      icon: CheckCircle2,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg Quote Time",
      value: `${stats.averageQuoteCompletionTime} days`,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Avg Data Quality",
      value: `${stats.averageDataQualityScore}%`,
      icon: BarChart3,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
    },
    {
      title: "Census Uploads",
      value: stats.totalCensusUploads,
      icon: FileText,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Total Files",
      value: stats.totalFiles,
      icon: FileText,
      color: "text-gray-500",
      bgColor: "bg-gray-50",
    },
    {
      title: "Active Info Requests",
      value: stats.activeInfoRequests,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Link href="/">
          <Button className="mb-4" variant="outline">
            ← Back to Dashboard
          </Button>
        </Link>
        <h1 className="mb-2 font-bold text-3xl">System Statistics</h1>
        <p className="text-muted-foreground">
          Overview of system-wide metrics and activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              className="transition-shadow hover:shadow-lg"
              key={stat.title}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground text-sm">
            <div className="flex justify-between">
              <span>Quote Completion Rate:</span>
              <span className="font-semibold text-foreground">
                {stats.activeQuotes + stats.completedQuotes > 0
                  ? Math.round(
                      (stats.completedQuotes /
                        (stats.activeQuotes + stats.completedQuotes)) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Files Per Client:</span>
              <span className="font-semibold text-foreground">
                {stats.totalClients > 0
                  ? Math.round((stats.totalFiles / stats.totalClients) * 10) /
                    10
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Clients with Census Data:</span>
              <span className="font-semibold text-foreground">
                {stats.totalCensusUploads > 0
                  ? Math.min(stats.totalCensusUploads, stats.totalClients)
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity Report */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Monthly Activity Report</CardTitle>
                <p className="mt-1 text-muted-foreground text-sm">
                  View activity metrics for a specific month
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                  value={String(selectedMonth)}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select month" />
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
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full sm:w-auto"
                  disabled={!monthlyReport}
                  onClick={generatePDF}
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyReport ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold text-sm">Clients Created</h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.clientsCreated}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <h3 className="font-semibold text-sm">Files Uploaded</h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.filesUploaded}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm">Census Uploads</h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.censusUploads}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Quotes Completed</h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.quotesCompleted}
                  </p>
                  <div className="mt-2 space-y-1 text-muted-foreground text-xs">
                    <div className="flex justify-between">
                      <span>Accepted:</span>
                      <span className="font-semibold text-green-600">
                        {monthlyReport.quotesAccepted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Declined:</span>
                      <span className="font-semibold text-red-600">
                        {monthlyReport.quotesDeclined}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <h3 className="font-semibold text-sm">
                      Info Requests Created
                    </h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.infoRequestsCreated}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <h3 className="font-semibold text-sm">
                      Info Requests Resolved
                    </h3>
                  </div>
                  <p className="font-bold text-3xl">
                    {monthlyReport.infoRequestsResolved}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading report...</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
