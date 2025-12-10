"use client";

import { useQuery } from "convex/react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

export default function StatisticsPage() {
  const stats = useQuery(api.statistics.getSystemStatistics, {});

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
    </div>
  );
}
