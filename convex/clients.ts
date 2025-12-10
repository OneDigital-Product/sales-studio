import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createClient = mutation({
  args: {
    name: v.string(),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("clients"),
  handler: async (ctx, args) => {
    const clientId = await ctx.db.insert("clients", {
      name: args.name,
      contactEmail: args.contactEmail,
      notes: args.notes,
    });
    return clientId;
  },
});

export const getClients = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clients"),
      _creationTime: v.number(),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      notes: v.optional(v.string()),
      activeCensusId: v.optional(v.id("census_uploads")),
    })
  ),
  handler: async (ctx) => await ctx.db.query("clients").collect(),
});

export const getClient = query({
  args: { id: v.id("clients") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("clients"),
      _creationTime: v.number(),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      notes: v.optional(v.string()),
      activeCensusId: v.optional(v.id("census_uploads")),
    })
  ),
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const updateClient = mutation({
  args: {
    id: v.id("clients"),
    name: v.string(),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      contactEmail: args.contactEmail,
      notes: args.notes,
    });
  },
});

const quoteStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("intake"),
  v.literal("underwriting"),
  v.literal("proposal_ready"),
  v.literal("presented"),
  v.literal("accepted"),
  v.literal("declined")
);

export const getClientsWithQuotes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clients"),
      _creationTime: v.number(),
      name: v.string(),
      contactEmail: v.optional(v.string()),
      notes: v.optional(v.string()),
      activeCensusId: v.optional(v.id("census_uploads")),
      peoQuote: v.optional(
        v.object({
          status: quoteStatusValidator,
          isBlocked: v.optional(v.boolean()),
        })
      ),
      acaQuote: v.optional(
        v.object({
          status: quoteStatusValidator,
          isBlocked: v.optional(v.boolean()),
        })
      ),
      documentCompleteness: v.object({
        percentage: v.number(),
        uploadedRequired: v.number(),
        totalRequired: v.number(),
      }),
    })
  ),
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();

    return await Promise.all(
      clients.map(async (client) => {
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_clientId", (q) => q.eq("clientId", client._id))
          .collect();

        const peoQuote = quotes.find((q) => q.type === "PEO");
        const acaQuote = quotes.find((q) => q.type === "ACA");

        // Get files for document completeness calculation
        const files = await ctx.db
          .query("files")
          .withIndex("by_clientId", (q) => q.eq("clientId", client._id))
          .collect();

        // Calculate document completeness
        const REQUIRED_CATEGORIES = [
          "census",
          "plan_summary",
          "renewal_letter",
        ];
        const totalRequired = REQUIRED_CATEGORIES.length;

        const uploadedCategories = new Set(
          files
            .filter(
              (f) => f.category && REQUIRED_CATEGORIES.includes(f.category)
            )
            .map((f) => f.category)
        );

        const uploadedRequired = uploadedCategories.size;
        const percentage =
          totalRequired > 0
            ? Math.round((uploadedRequired / totalRequired) * 100)
            : 100;

        return {
          ...client,
          peoQuote: peoQuote
            ? {
                status: peoQuote.status,
                isBlocked: peoQuote.isBlocked,
              }
            : undefined,
          acaQuote: acaQuote
            ? {
                status: acaQuote.status,
                isBlocked: acaQuote.isBlocked,
              }
            : undefined,
          documentCompleteness: {
            percentage,
            uploadedRequired,
            totalRequired,
          },
        };
      })
    );
  },
});

export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // 1. Delete all files and their storage
    const files = await ctx.db
      .query("files")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const file of files) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }

    // 2. Delete all census uploads and their rows
    const censusUploads = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const census of censusUploads) {
      // Delete all rows for this census
      const rows = await ctx.db
        .query("census_rows")
        .withIndex("by_censusUploadId", (q) =>
          q.eq("censusUploadId", census._id)
        )
        .collect();

      for (const row of rows) {
        await ctx.db.delete(row._id);
      }

      // Delete census validations
      const validations = await ctx.db
        .query("census_validations")
        .withIndex("by_censusUploadId", (q) =>
          q.eq("censusUploadId", census._id)
        )
        .collect();

      for (const validation of validations) {
        await ctx.db.delete(validation._id);
      }

      // Delete census upload
      await ctx.db.delete(census._id);
    }

    // 3. Delete all quotes and their history
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const quote of quotes) {
      // Delete quote history
      const history = await ctx.db
        .query("quote_history")
        .withIndex("by_quoteId", (q) => q.eq("quoteId", quote._id))
        .collect();

      for (const historyEntry of history) {
        await ctx.db.delete(historyEntry._id);
      }

      // Delete quote
      await ctx.db.delete(quote._id);
    }

    // 4. Delete all comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 5. Delete all info requests
    const infoRequests = await ctx.db
      .query("info_requests")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const request of infoRequests) {
      await ctx.db.delete(request._id);
    }

    // 6. Finally, delete the client
    await ctx.db.delete(args.clientId);
  },
});
