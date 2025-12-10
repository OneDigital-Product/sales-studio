import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const quoteTypeValidator = v.union(v.literal("PEO"), v.literal("ACA"));

const quoteStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("intake"),
  v.literal("underwriting"),
  v.literal("proposal_ready"),
  v.literal("presented"),
  v.literal("accepted"),
  v.literal("declined")
);

export const getQuotesByClient = query({
  args: { clientId: v.id("clients") },
  returns: v.array(
    v.object({
      _id: v.id("quotes"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      type: quoteTypeValidator,
      status: quoteStatusValidator,
      isBlocked: v.optional(v.boolean()),
      blockedReason: v.optional(v.string()),
      assignedTo: v.optional(v.string()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) =>
    await ctx.db
      .query("quotes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect(),
});

export const updateQuoteStatus = mutation({
  args: {
    clientId: v.id("clients"),
    type: quoteTypeValidator,
    status: quoteStatusValidator,
    isBlocked: v.optional(v.boolean()),
    blockedReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("quotes"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_clientId_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("type", args.type)
      )
      .unique();

    const now = Date.now();
    const isTerminalStatus =
      args.status === "accepted" || args.status === "declined";

    if (existing) {
      // Record history if status changed
      if (existing.status !== args.status) {
        await ctx.db.insert("quote_history", {
          quoteId: existing._id,
          previousStatus: existing.status,
          newStatus: args.status,
          changedAt: now,
          notes: args.notes,
        });
      }

      await ctx.db.patch(existing._id, {
        status: args.status,
        isBlocked: args.isBlocked ?? false,
        blockedReason: args.isBlocked ? args.blockedReason : undefined,
        notes: args.notes,
        startedAt:
          existing.startedAt ??
          (args.status !== "not_started" ? now : undefined),
        completedAt: isTerminalStatus ? now : undefined,
      });
      return existing._id;
    }

    // Create new quote
    return await ctx.db.insert("quotes", {
      clientId: args.clientId,
      type: args.type,
      status: args.status,
      isBlocked: args.isBlocked ?? false,
      blockedReason: args.isBlocked ? args.blockedReason : undefined,
      notes: args.notes,
      startedAt: args.status !== "not_started" ? now : undefined,
      completedAt: isTerminalStatus ? now : undefined,
    });
  },
});

export const getQuoteHistory = query({
  args: { quoteId: v.id("quotes") },
  returns: v.array(
    v.object({
      _id: v.id("quote_history"),
      _creationTime: v.number(),
      quoteId: v.id("quotes"),
      previousStatus: v.string(),
      newStatus: v.string(),
      changedAt: v.number(),
      changedBy: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) =>
    await ctx.db
      .query("quote_history")
      .withIndex("by_quoteId", (q) => q.eq("quoteId", args.quoteId))
      .order("desc")
      .collect(),
});

export const updateQuoteAssignment = mutation({
  args: {
    quoteId: v.id("quotes"),
    assignedTo: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.quoteId, {
      assignedTo: args.assignedTo,
    });
  },
});

export const batchUpdateQuoteStatus = mutation({
  args: {
    quoteIds: v.array(v.id("quotes")),
    status: quoteStatusValidator,
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const isTerminalStatus =
      args.status === "accepted" || args.status === "declined";

    for (const quoteId of args.quoteIds) {
      const existing = await ctx.db.get(quoteId);
      if (!existing) continue;

      // Record history if status changed
      if (existing.status !== args.status) {
        await ctx.db.insert("quote_history", {
          quoteId: existing._id,
          previousStatus: existing.status,
          newStatus: args.status,
          changedAt: now,
          notes: args.notes,
        });
      }

      await ctx.db.patch(quoteId, {
        status: args.status,
        notes: args.notes,
        startedAt:
          existing.startedAt ??
          (args.status !== "not_started" ? now : undefined),
        completedAt: isTerminalStatus ? now : undefined,
      });
    }
  },
});

export const getQuotesDashboard = query({
  args: {},
  returns: v.array(
    v.object({
      client: v.object({
        _id: v.id("clients"),
        name: v.string(),
        contactEmail: v.optional(v.string()),
      }),
      peoQuote: v.union(
        v.object({
          _id: v.id("quotes"),
          status: quoteStatusValidator,
          isBlocked: v.optional(v.boolean()),
          blockedReason: v.optional(v.string()),
          startedAt: v.optional(v.number()),
          completedAt: v.optional(v.number()),
        }),
        v.null()
      ),
      acaQuote: v.union(
        v.object({
          _id: v.id("quotes"),
          status: quoteStatusValidator,
          isBlocked: v.optional(v.boolean()),
          blockedReason: v.optional(v.string()),
          startedAt: v.optional(v.number()),
          completedAt: v.optional(v.number()),
        }),
        v.null()
      ),
      daysOpen: v.number(),
    })
  ),
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    const allQuotes = await ctx.db.query("quotes").collect();

    const quotesByClient = new Map<
      string,
      { peo: (typeof allQuotes)[0] | null; aca: (typeof allQuotes)[0] | null }
    >();

    for (const quote of allQuotes) {
      const clientId = quote.clientId;
      const existing = quotesByClient.get(clientId) ?? { peo: null, aca: null };
      if (quote.type === "PEO") {
        existing.peo = quote;
      } else {
        existing.aca = quote;
      }
      quotesByClient.set(clientId, existing);
    }

    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    return clients.map((client) => {
      const quotes = quotesByClient.get(client._id) ?? { peo: null, aca: null };
      const peoQuote = quotes.peo;
      const acaQuote = quotes.aca;

      // Calculate days open from earliest startedAt
      const startDates = [peoQuote?.startedAt, acaQuote?.startedAt].filter(
        (d): d is number => d !== undefined
      );
      const earliestStart =
        startDates.length > 0 ? Math.min(...startDates) : null;
      const daysOpen = earliestStart
        ? Math.floor((now - earliestStart) / msPerDay)
        : 0;

      return {
        client: {
          _id: client._id,
          name: client.name,
          contactEmail: client.contactEmail,
        },
        peoQuote: peoQuote
          ? {
              _id: peoQuote._id,
              status: peoQuote.status,
              isBlocked: peoQuote.isBlocked,
              blockedReason: peoQuote.blockedReason,
              startedAt: peoQuote.startedAt,
              completedAt: peoQuote.completedAt,
            }
          : null,
        acaQuote: acaQuote
          ? {
              _id: acaQuote._id,
              status: acaQuote.status,
              isBlocked: acaQuote.isBlocked,
              blockedReason: acaQuote.blockedReason,
              startedAt: acaQuote.startedAt,
              completedAt: acaQuote.completedAt,
            }
          : null,
        daysOpen,
      };
    });
  },
});
