"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommentItem } from "./comment-item";

type CommentFeedProps = {
  clientId: Id<"clients">;
};

export function CommentFeed({ clientId }: CommentFeedProps) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTeam, setAuthorTeam] = useState<"PEO" | "ACA" | "Sales">("PEO");
  const [isAdding, setIsAdding] = useState(false);
  const [teamFilter, setTeamFilter] = useState<"All" | "PEO" | "ACA" | "Sales">(
    "All"
  );

  const comments = useQuery(api.comments.getComments, { clientId });
  const addComment = useMutation(api.comments.addComment);
  const resolveComment = useMutation(api.comments.resolveComment);
  const unresolveComment = useMutation(api.comments.unresolveComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(content.trim() && authorName.trim())) return;

    try {
      await addComment({
        clientId,
        targetType: "client",
        content: content.trim(),
        authorName: authorName.trim(),
        authorTeam,
      });
      setContent("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleResolve = async (commentId: Id<"comments">) => {
    try {
      await resolveComment({
        commentId,
        resolvedBy: authorName || "Unknown",
      });
    } catch (error) {
      console.error("Failed to resolve comment:", error);
    }
  };

  const handleUnresolve = async (commentId: Id<"comments">) => {
    try {
      await unresolveComment({ commentId });
    } catch (error) {
      console.error("Failed to unresolve comment:", error);
    }
  };

  // Filter comments by team
  const filteredComments =
    comments?.filter((comment) => {
      if (teamFilter === "All") return true;
      return comment.authorTeam === teamFilter;
    }) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Feed</CardTitle>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) =>
              setTeamFilter(e.target.value as "All" | "PEO" | "ACA" | "Sales")
            }
            value={teamFilter}
          >
            <option value="All">All Teams</option>
            <option value="PEO">PEO Only</option>
            <option value="ACA">ACA Only</option>
            <option value="Sales">Sales Only</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Button/Form */}
        {isAdding ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                required
                type="text"
                value={authorName}
              />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) =>
                  setAuthorTeam(e.target.value as "PEO" | "ACA" | "Sales")
                }
                value={authorTeam}
              >
                <option value="PEO">PEO Team</option>
                <option value="ACA">ACA Team</option>
                <option value="Sales">Sales Team</option>
              </select>
            </div>
            <Textarea
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your comment..."
              required
              rows={4}
              value={content}
            />
            <div className="flex gap-2">
              <Button
                disabled={!(content.trim() && authorName.trim())}
                type="submit"
              >
                Submit
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setContent("");
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button className="w-full" onClick={() => setIsAdding(true)}>
            Add Comment
          </Button>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments === undefined ? (
            <p className="text-muted-foreground text-sm">Loading comments...</p>
          ) : filteredComments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {teamFilter === "All"
                ? "No comments yet. Be the first to add one!"
                : `No ${teamFilter} comments found.`}
            </p>
          ) : (
            filteredComments.map((comment) => (
              <CommentItem
                authorName={comment.authorName}
                authorTeam={comment.authorTeam}
                content={comment.content}
                createdAt={comment.createdAt}
                isResolved={comment.isResolved}
                key={comment._id}
                onResolve={() => handleResolve(comment._id)}
                onUnresolve={() => handleUnresolve(comment._id)}
                resolvedAt={comment.resolvedAt}
                resolvedBy={comment.resolvedBy}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
