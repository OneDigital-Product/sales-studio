import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveCensus = mutation({
  args: {
    clientId: v.id("clients"),
    fileName: v.string(),
    columns: v.array(v.string()),
    rows: v.array(v.any()), // Array of row objects
  },
  handler: async (ctx, args) => {
    const censusUploadId = await ctx.db.insert("census_uploads", {
      clientId: args.clientId,
      fileName: args.fileName,
      uploadedAt: Date.now(),
      columns: args.columns,
      rowCount: args.rows.length,
    });

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

    return censusUploadId;
  },
});

export const getCensus = query({
  args: {
    censusUploadId: v.id("census_uploads"),
    paginationOpts: paginationOptsValidator,
  },
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

export const getLatestCensus = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const upload = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();

    return upload;
  },
});
