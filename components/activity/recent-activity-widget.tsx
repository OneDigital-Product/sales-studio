"use client";

import { useQuery } from "convex/react";
import { Inbox, MessageSquare, TrendingUp } from "lucide-react";
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
import { api } from "@/convex/_generated/api";

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function getTeamBadgeColor(team: "PEO" | "ACA" | "Sales") {
  switch (team) {
    case "PEO":
      return "bg-primary/10 text-foreground";
    case "ACA":
      return "bg-secondary text-foreground";
    case "Sales":
      return "bg-teal-100 text-teal-800";
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function RecentActivityWidget() {
  const activities = useQuery(api.comments.getRecentActivity, { limit: 5 });

  if (activities === undefined) {
    return (
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-base text-primary">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-base text-primary">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <EmptyState
            description="Activity will appear here as team members add comments and update quote statuses."
            icon={Inbox}
            title="No Recent Activity"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="border-b px-6 py-4">
        <CardTitle className="text-base text-primary">
          Recent Activity
        </CardTitle>
        <CardDescription>Latest comments and status changes</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.map((activity, index) => (
            <div className="px-6 py-3" key={index}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {activity.type === "comment" ? (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/clients/${activity.clientId}`}
                    >
                      {activity.clientName}
                    </Link>
                    {activity.type === "comment" && (
                      <Badge
                        className={`text-xs ${getTeamBadgeColor(activity.authorTeam)}`}
                        variant="outline"
                      >
                        {activity.authorTeam}
                      </Badge>
                    )}
                    {activity.type === "status_change" && (
                      <Badge
                        className={`text-xs ${activity.quoteType === "PEO" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"}`}
                        variant="outline"
                      >
                        {activity.quoteType}
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground text-sm">
                    {activity.type === "comment" ? (
                      <>
                        <span className="font-medium">
                          {activity.authorName}:
                        </span>{" "}
                        {activity.content}
                      </>
                    ) : (
                      <>
                        Status changed from{" "}
                        <span className="font-medium">
                          {formatStatus(activity.previousStatus)}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {formatStatus(activity.newStatus)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
