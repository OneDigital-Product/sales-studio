import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const saveCensus = mutation({
  args: {
    clientId: v.id("clients"),
    fileId: v.optional(v.id("files")),
    fileName: v.string(),
    columns: v.array(v.string()),
    rows: v.array(v.any()), // Array of row objects
  },
  returns: v.id("census_uploads"),
  handler: async (ctx, args) => {
    const censusUploadId = await ctx.db.insert("census_uploads", {
      clientId: args.clientId,
      fileId: args.fileId,
      fileName: args.fileName,
      uploadedAt: Date.now(),
      columns: args.columns,
      rowCount: args.rows.length,
    });

    // Update the client's active census to this new upload
    await ctx.db.patch(args.clientId, { activeCensusId: censusUploadId });

    // Insert rows in batches to avoid hitting size limits if necessary,
    // though Convex handles large transactions relatively well, keeping it simple for now.
    // For extremely large files, client-side batching or background jobs would be better.
    // Here we assume a reasonable file size for an interactive upload.
    await Promise.all(
      args.rows.map((row, index) =>
        ctx.db.insert("census_rows", {
          censusUploadId,
          data: row,
          rowIndex: index,
        })
      )
    );

    // Schedule validation to run after save completes
    await ctx.scheduler.runAfter(0, internal.censusValidation.runValidation, {
      censusUploadId,
    });

    return censusUploadId;
  },
});

export const getCensus = query({
  args: {
    censusUploadId: v.id("census_uploads"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.censusUploadId);
    if (!upload) {
      throw new Error("Census upload not found");
    }

    const rows = await ctx.db
      .query("census_rows")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .order("asc")
      .paginate(args.paginationOpts);

    return {
      upload,
      rows,
    };
  },
});

export const setActiveCensus = mutation({
  args: { clientId: v.id("clients"), censusUploadId: v.id("census_uploads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientId, { activeCensusId: args.censusUploadId });
  },
});

export const getActiveCensus = query({
  args: { clientId: v.id("clients") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("census_uploads"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      fileId: v.optional(v.id("files")),
      fileName: v.string(),
      uploadedAt: v.number(),
      columns: v.array(v.string()),
      rowCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      return null;
    }

    if (client.activeCensusId) {
      const upload = await ctx.db.get(client.activeCensusId);
      if (upload) {
        return upload;
      }
    }

    // Fallback to latest if no active selection or if active ID is invalid/missing
    const upload = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();

    return upload;
  },
});

export const getCensusHistory = query({
  args: { clientId: v.id("clients") },
  returns: v.array(
    v.object({
      _id: v.id("census_uploads"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      fileId: v.optional(v.id("files")),
      fileName: v.string(),
      uploadedAt: v.number(),
      columns: v.array(v.string()),
      rowCount: v.number(),
    })
  ),
  handler: async (ctx, args) =>
    await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect(),
});

export const getLatestCensus = query({
  args: { clientId: v.id("clients") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("census_uploads"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      fileId: v.optional(v.id("files")),
      fileName: v.string(),
      uploadedAt: v.number(),
      columns: v.array(v.string()),
      rowCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const upload = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();

    return upload;
  },
});
