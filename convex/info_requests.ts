import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createInfoRequest = mutation({
  args: {
    clientId: v.id("clients"),
    quoteType: v.optional(
      v.union(v.literal("PEO"), v.literal("ACA"), v.literal("both"))
    ),
    items: v.array(
      v.object({
        description: v.string(),
        category: v.optional(v.string()),
      })
    ),
    requestedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert("info_requests", {
      clientId: args.clientId,
      quoteType: args.quoteType,
      status: "pending",
      requestedAt: Date.now(),
      requestedBy: args.requestedBy,
      items: args.items.map((item) => ({
        description: item.description,
        category: item.category,
        received: false,
      })),
      notes: args.notes,
    });
    return requestId;
  },
  returns: v.id("info_requests"),
});

export const getInfoRequests = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("info_requests")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
    return requests;
  },
  returns: v.array(
    v.object({
      _id: v.id("info_requests"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      quoteType: v.optional(
        v.union(v.literal("PEO"), v.literal("ACA"), v.literal("both"))
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("received"),
        v.literal("cancelled")
      ),
      requestedAt: v.number(),
      requestedBy: v.optional(v.string()),
      resolvedAt: v.optional(v.number()),
      items: v.array(
        v.object({
          description: v.string(),
          category: v.optional(v.string()),
          received: v.boolean(),
          receivedAt: v.optional(v.number()),
        })
      ),
      notes: v.optional(v.string()),
      reminderSentAt: v.optional(v.number()),
    })
  ),
});

export const getPendingInfoRequests = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("info_requests")
      .withIndex("by_clientId_and_status", (q) =>
        q.eq("clientId", args.clientId).eq("status", "pending")
      )
      .order("desc")
      .collect();
    return requests;
  },
  returns: v.array(
    v.object({
      _id: v.id("info_requests"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      quoteType: v.optional(
        v.union(v.literal("PEO"), v.literal("ACA"), v.literal("both"))
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("received"),
        v.literal("cancelled")
      ),
      requestedAt: v.number(),
      requestedBy: v.optional(v.string()),
      resolvedAt: v.optional(v.number()),
      items: v.array(
        v.object({
          description: v.string(),
          category: v.optional(v.string()),
          received: v.boolean(),
          receivedAt: v.optional(v.number()),
        })
      ),
      notes: v.optional(v.string()),
      reminderSentAt: v.optional(v.number()),
    })
  ),
});

export const markItemReceived = mutation({
  args: {
    requestId: v.id("info_requests"),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const updatedItems = request.items.map((item, index) => {
      if (index === args.itemIndex) {
        return {
          ...item,
          received: true,
          receivedAt: Date.now(),
        };
      }
      return item;
    });

    // Check if all items are received
    const allReceived = updatedItems.every((item) => item.received);

    await ctx.db.patch(args.requestId, {
      items: updatedItems,
      status: allReceived ? "received" : request.status,
      resolvedAt: allReceived ? Date.now() : request.resolvedAt,
    });

    return null;
  },
  returns: v.null(),
});

export const markItemNotReceived = mutation({
  args: {
    requestId: v.id("info_requests"),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const updatedItems = request.items.map((item, index) => {
      if (index === args.itemIndex) {
        return {
          ...item,
          received: false,
          receivedAt: undefined,
        };
      }
      return item;
    });

    await ctx.db.patch(args.requestId, {
      items: updatedItems,
      status: "pending",
      resolvedAt: undefined,
    });

    return null;
  },
  returns: v.null(),
});

export const cancelInfoRequest = mutation({
  args: {
    requestId: v.id("info_requests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      resolvedAt: Date.now(),
    });
    return null;
  },
  returns: v.null(),
});
