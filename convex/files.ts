import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(
  async (ctx) => await ctx.storage.generateUploadUrl()
);

export const saveFile = mutation({
  args: {
    storageId: v.string(),
    clientId: v.id("clients"),
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      storageId: args.storageId,
      clientId: args.clientId,
      name: args.name,
      type: args.type,
      uploadedAt: Date.now(),
    });
  },
});

export const getFiles = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );
  },
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      return;
    }

    // Find matching census uploads by fileName and clientId
    const matchingCensusUploads = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", file.clientId))
      .collect();

    const censusToDelete = matchingCensusUploads.filter(
      (upload) => upload.fileName === file.name
    );

    // Get client once to check activeCensusId
    const client = await ctx.db.get(file.clientId);
    let needsActiveCensusUpdate = false;

    // Delete census data if found
    for (const censusUpload of censusToDelete) {
      // Delete all census_rows for this upload
      const rows = await ctx.db
        .query("census_rows")
        .withIndex("by_censusUploadId", (q) =>
          q.eq("censusUploadId", censusUpload._id)
        )
        .collect();

      for (const row of rows) {
        await ctx.db.delete(row._id);
      }

      // Check if this was the active census
      if (client?.activeCensusId === censusUpload._id) {
        needsActiveCensusUpdate = true;
      }

      // Delete the census_uploads entry
      await ctx.db.delete(censusUpload._id);
    }

    // Update activeCensusId if needed
    if (needsActiveCensusUpdate && client) {
      // Find the next available census or clear activeCensusId
      const remainingCensus = await ctx.db
        .query("census_uploads")
        .withIndex("by_clientId", (q) => q.eq("clientId", file.clientId))
        .order("desc")
        .first();

      await ctx.db.patch(file.clientId, {
        activeCensusId: remainingCensus?._id ?? undefined,
      });
    }

    // Delete the file storage and record
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.id);
  },
});
