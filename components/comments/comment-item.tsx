"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type CommentItemProps = {
  content: string;
  authorName: string;
  authorTeam: "PEO" | "ACA" | "Sales";
  createdAt: number;
  isResolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  onResolve?: () => void;
  onUnresolve?: () => void;
};

export function CommentItem({
  content,
  authorName,
  authorTeam,
  createdAt,
  isResolved,
  resolvedAt,
  resolvedBy,
  onResolve,
  onUnresolve,
}: CommentItemProps) {
  const getTeamColor = () => {
    switch (authorTeam) {
      case "PEO":
        return "bg-blue-100 text-blue-700";
      case "ACA":
        return "bg-purple-100 text-purple-700";
      case "Sales":
        return "bg-teal-100 text-teal-700";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline visual */}
      <div className="relative flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
          <MessageCircle className="h-4 w-4 text-blue-500" />
        </div>
        <div className="absolute top-8 h-full w-0.5 bg-gray-200" />
      </div>

      {/* Comment content */}
      <div
        className={`flex-1 rounded-lg border p-4 ${
          isResolved
            ? "border-gray-200 bg-gray-50 opacity-70"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{authorName}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-medium text-xs ${getTeamColor()}`}
              >
                {authorTeam}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatDate(createdAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{content}</p>
            {isResolved && resolvedAt && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  Resolved by {resolvedBy} on {formatDate(resolvedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div>
          {isResolved
            ? onUnresolve && (
                <Button
                  className="text-xs"
                  onClick={onUnresolve}
                  size="sm"
                  variant="ghost"
                >
                  Unresolve
                </Button>
              )
            : onResolve && (
                <Button
                  className="text-xs"
                  onClick={onResolve}
                  size="sm"
                  variant="ghost"
                >
                  Resolve
                </Button>
              )}
        </div>
      </div>
    </div>
  );
}
