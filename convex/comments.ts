import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add a new comment
export const addComment = mutation({
  args: {
    clientId: v.id("clients"),
    targetType: v.union(
      v.literal("client"),
      v.literal("file"),
      v.literal("census")
    ),
    targetId: v.optional(v.string()),
    content: v.string(),
    authorName: v.string(),
    authorTeam: v.union(v.literal("PEO"), v.literal("ACA"), v.literal("Sales")),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      clientId: args.clientId,
      targetType: args.targetType,
      targetId: args.targetId,
      content: args.content,
      authorName: args.authorName,
      authorTeam: args.authorTeam,
      createdAt: Date.now(),
      isResolved: false,
    });
    return commentId;
  },
  returns: v.id("comments"),
});

// Get all comments for a client (activity feed)
export const getComments = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_clientId_and_createdAt", (q) =>
        q.eq("clientId", args.clientId)
      )
      .order("desc")
      .collect();
    return comments;
  },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      targetType: v.union(
        v.literal("client"),
        v.literal("file"),
        v.literal("census")
      ),
      targetId: v.optional(v.string()),
      content: v.string(),
      authorName: v.string(),
      authorTeam: v.union(
        v.literal("PEO"),
        v.literal("ACA"),
        v.literal("Sales")
      ),
      createdAt: v.number(),
      isResolved: v.optional(v.boolean()),
      resolvedAt: v.optional(v.number()),
      resolvedBy: v.optional(v.string()),
    })
  ),
});

// Get comments for a specific target (file or census)
export const getTargetComments = query({
  args: {
    targetType: v.union(
      v.literal("client"),
      v.literal("file"),
      v.literal("census")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_targetType_and_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .order("desc")
      .collect();
    return comments;
  },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      targetType: v.union(
        v.literal("client"),
        v.literal("file"),
        v.literal("census")
      ),
      targetId: v.optional(v.string()),
      content: v.string(),
      authorName: v.string(),
      authorTeam: v.union(
        v.literal("PEO"),
        v.literal("ACA"),
        v.literal("Sales")
      ),
      createdAt: v.number(),
      isResolved: v.optional(v.boolean()),
      resolvedAt: v.optional(v.number()),
      resolvedBy: v.optional(v.string()),
    })
  ),
});

// Resolve a comment
export const resolveComment = mutation({
  args: {
    commentId: v.id("comments"),
    resolvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      isResolved: true,
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    });
    return null;
  },
  returns: v.null(),
});

// Unresolve a comment
export const unresolveComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      isResolved: false,
      resolvedAt: undefined,
      resolvedBy: undefined,
    });
    return null;
  },
  returns: v.null(),
});

// Get comment count for a specific target
export const getTargetCommentCount = query({
  args: {
    targetType: v.union(
      v.literal("client"),
      v.literal("file"),
      v.literal("census")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_targetType_and_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();
    return comments.length;
  },
  returns: v.number(),
});

// Get recent activity across all clients (for home page widget)
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get recent comments
    const recentComments = await ctx.db
      .query("comments")
      .order("desc")
      .take(limit * 2); // Get more than needed to have options after merging

    // Get recent quote history
    const recentQuoteHistory = await ctx.db
      .query("quote_history")
      .order("desc")
      .take(limit * 2);

    // Build activity items with client names
    const activities = [];

    // Process comments
    for (const comment of recentComments) {
      const client = await ctx.db.get(comment.clientId);
      if (client) {
        activities.push({
          type: "comment" as const,
          timestamp: comment.createdAt,
          clientId: comment.clientId,
          clientName: client.name,
          authorName: comment.authorName,
          authorTeam: comment.authorTeam,
          content: comment.content,
        });
      }
    }

    // Process quote history
    for (const history of recentQuoteHistory) {
      const quote = await ctx.db.get(history.quoteId);
      if (quote) {
        const client = await ctx.db.get(quote.clientId);
        if (client) {
          activities.push({
            type: "status_change" as const,
            timestamp: history.changedAt,
            clientId: quote.clientId,
            clientName: client.name,
            quoteType: quote.type,
            previousStatus: history.previousStatus,
            newStatus: history.newStatus,
            changedBy: history.changedBy,
          });
        }
      }
    }

    // Sort by timestamp descending and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
  returns: v.array(
    v.union(
      v.object({
        type: v.literal("comment"),
        timestamp: v.number(),
        clientId: v.id("clients"),
        clientName: v.string(),
        authorName: v.string(),
        authorTeam: v.union(
          v.literal("PEO"),
          v.literal("ACA"),
          v.literal("Sales")
        ),
        content: v.string(),
      }),
      v.object({
        type: v.literal("status_change"),
        timestamp: v.number(),
        clientId: v.id("clients"),
        clientName: v.string(),
        quoteType: v.union(v.literal("PEO"), v.literal("ACA")),
        previousStatus: v.string(),
        newStatus: v.string(),
        changedBy: v.optional(v.string()),
      })
    )
  ),
});
