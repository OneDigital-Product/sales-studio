import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add bookmark for a client
export const addBookmark = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Check if bookmark already exists
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      clientId: args.clientId,
      bookmarkedAt: Date.now(),
    });

    return bookmarkId;
  },
  returns: v.id("bookmarks"),
});

// Remove bookmark for a client
export const removeBookmark = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    if (bookmark) {
      await ctx.db.delete(bookmark._id);
    }

    return null;
  },
  returns: v.null(),
});

// Check if a client is bookmarked
export const isBookmarked = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .unique();

    return bookmark !== null;
  },
  returns: v.boolean(),
});

// Get all bookmarked clients with their details
export const getBookmarkedClients = query({
  args: {},
  handler: async (ctx) => {
    const bookmarks = await ctx.db.query("bookmarks").collect();

    const clientsWithDetails = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const client = await ctx.db.get(bookmark.clientId);
        if (!client) return null;

        // Get quote statuses
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_clientId", (q) => q.eq("clientId", bookmark.clientId))
          .collect();

        const peoQuote = quotes.find((q) => q.type === "PEO");
        const acaQuote = quotes.find((q) => q.type === "ACA");

        // Get document count
        const files = await ctx.db
          .query("files")
          .withIndex("by_clientId", (q) => q.eq("clientId", bookmark.clientId))
          .collect();

        return {
          _id: client._id,
          name: client.name,
          contactEmail: client.contactEmail,
          notes: client.notes,
          bookmarkedAt: bookmark.bookmarkedAt,
          peoQuoteStatus: peoQuote?.status,
          acaQuoteStatus: acaQuote?.status,
          documentCount: files.length,
        };
      })
    );

    return clientsWithDetails
      .filter((c) => c !== null)
      .sort((a, b) => (b?.bookmarkedAt || 0) - (a?.bookmarkedAt || 0));
  },
  returns: v.array(
    v.object({
      _id: v.id("clients"),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      notes: v.optional(v.string()),
      bookmarkedAt: v.number(),
      peoQuoteStatus: v.optional(
        v.union(
          v.literal("not_started"),
          v.literal("intake"),
          v.literal("underwriting"),
          v.literal("proposal_ready"),
          v.literal("presented"),
          v.literal("accepted"),
          v.literal("declined")
        )
      ),
      acaQuoteStatus: v.optional(
        v.union(
          v.literal("not_started"),
          v.literal("intake"),
          v.literal("underwriting"),
          v.literal("proposal_ready"),
          v.literal("presented"),
          v.literal("accepted"),
          v.literal("declined")
        )
      ),
      documentCount: v.number(),
    })
  ),
});
