import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";

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

    // For large imports (>1000 rows), use background jobs to avoid timeouts
    // For smaller imports, insert synchronously for immediate feedback
    const BATCH_SIZE = 500;
    const USE_BACKGROUND_JOBS_THRESHOLD = 1000;

    if (args.rows.length > USE_BACKGROUND_JOBS_THRESHOLD) {
      // Schedule batch insertions as background jobs for large imports
      for (let i = 0; i < args.rows.length; i += BATCH_SIZE) {
        const batch = args.rows.slice(i, i + BATCH_SIZE);
        await ctx.scheduler.runAfter(0, internal.census.insertCensusRowsBatch, {
          censusUploadId,
          rows: batch,
          startIndex: i,
        });
      }
    } else {
      // For smaller imports, insert directly for immediate user feedback
      await Promise.all(
        args.rows.map((row, index) =>
          ctx.db.insert("census_rows", {
            censusUploadId,
            data: row,
            rowIndex: index,
          })
        )
      );
    }

    // Schedule validation to run after save completes
    // For large imports, add a delay to ensure all batches are inserted first
    const validationDelay =
      args.rows.length > USE_BACKGROUND_JOBS_THRESHOLD ? 5000 : 0;
    await ctx.scheduler.runAfter(
      validationDelay,
      internal.censusValidation.runValidation,
      {
        censusUploadId,
      }
    );

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

// Get all census rows for export (no pagination)
export const getAllCensusRows = query({
  args: {
    censusUploadId: v.id("census_uploads"),
  },
  returns: v.object({
    upload: v.object({
      _id: v.id("census_uploads"),
      _creationTime: v.number(),
      clientId: v.id("clients"),
      fileId: v.optional(v.id("files")),
      fileName: v.string(),
      uploadedAt: v.number(),
      columns: v.array(v.string()),
      rowCount: v.number(),
    }),
    rows: v.array(
      v.object({
        _id: v.id("census_rows"),
        _creationTime: v.number(),
        censusUploadId: v.id("census_uploads"),
        data: v.any(),
        rowIndex: v.number(),
      })
    ),
  }),
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
      .collect();

    return {
      upload,
      rows,
    };
  },
});

// Internal mutation for batch row insertion
// Handles large census imports by processing rows in batches
export const insertCensusRowsBatch = internalMutation({
  args: {
    censusUploadId: v.id("census_uploads"),
    rows: v.array(v.any()),
    startIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Insert all rows in this batch
    await Promise.all(
      args.rows.map((row, batchIndex) =>
        ctx.db.insert("census_rows", {
          censusUploadId: args.censusUploadId,
          data: row,
          rowIndex: args.startIndex + batchIndex,
        })
      )
    );
  },
});
