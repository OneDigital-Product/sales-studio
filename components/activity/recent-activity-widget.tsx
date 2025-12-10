"use client";

import { useQuery } from "convex/react";
import { MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

function getTeamBadgeColor(team: "PEO" | "ACA" | "Sales") {
  switch (team) {
    case "PEO":
      return "bg-blue-100 text-blue-800";
    case "ACA":
      return "bg-purple-100 text-purple-800";
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No recent activity. Activity will appear here as team members add
            comments and update quote statuses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
              key={index}
            >
              {activity.type === "comment" ? (
                <div className="mt-1 flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                </div>
              ) : (
                <div className="mt-1 flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                </div>
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    className="font-medium text-blue-600 text-sm hover:underline"
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
                      className={`text-xs ${activity.quoteType === "PEO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                      variant="outline"
                    >
                      {activity.quoteType}
                    </Badge>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>

                {activity.type === "comment" ? (
                  <div className="space-y-0.5">
                    <p className="text-gray-600 text-xs">
                      <span className="font-medium">{activity.authorName}</span>{" "}
                      commented:
                    </p>
                    <p className="text-gray-800 text-sm">
                      {activity.content.length > 100
                        ? `${activity.content.slice(0, 100)}...`
                        : activity.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm">
                    Quote status changed from{" "}
                    <span className="font-medium">
                      {formatStatus(activity.previousStatus)}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {formatStatus(activity.newStatus)}
                    </span>
                    {activity.changedBy && (
                      <span className="text-gray-600">
                        {" "}
                        by {activity.changedBy}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
