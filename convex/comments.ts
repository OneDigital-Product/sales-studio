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
