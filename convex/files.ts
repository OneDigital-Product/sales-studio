import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const saveFile = mutation({
  args: {
    storageId: v.string(),
    clientId: v.id("clients"),
    name: v.string(),
    type: v.string(),
    category: v.optional(
      v.union(
        v.literal("census"),
        v.literal("plan_summary"),
        v.literal("claims_history"),
        v.literal("renewal_letter"),
        v.literal("proposal"),
        v.literal("contract"),
        v.literal("other")
      )
    ),
    relevantTo: v.optional(
      v.array(v.union(v.literal("PEO"), v.literal("ACA")))
    ),
    description: v.optional(v.string()),
    uploadedBy: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      clientId: args.clientId,
      name: args.name,
      type: args.type,
      uploadedAt: Date.now(),
      category: args.category,
      relevantTo: args.relevantTo,
      description: args.description,
      uploadedBy: args.uploadedBy,
      isRequired: args.isRequired,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
    });
    return fileId;
  },
});

export const getFiles = query({
  args: { clientId: v.id("clients") },
  returns: v.array(
    v.object({
      _id: v.id("files"),
      _creationTime: v.number(),
      storageId: v.string(),
      clientId: v.id("clients"),
      name: v.string(),
      type: v.string(),
      uploadedAt: v.number(),
      url: v.union(v.string(), v.null()),
      category: v.optional(
        v.union(
          v.literal("census"),
          v.literal("plan_summary"),
          v.literal("claims_history"),
          v.literal("renewal_letter"),
          v.literal("proposal"),
          v.literal("contract"),
          v.literal("other")
        )
      ),
      relevantTo: v.optional(
        v.array(v.union(v.literal("PEO"), v.literal("ACA")))
      ),
      description: v.optional(v.string()),
      uploadedBy: v.optional(v.string()),
      isVerified: v.optional(v.boolean()),
      verifiedBy: v.optional(v.string()),
      verifiedAt: v.optional(v.number()),
      isRequired: v.optional(v.boolean()),
      mimeType: v.optional(v.string()),
      fileSize: v.optional(v.number()),
    })
  ),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      return;
    }

    // Find matching census uploads by fileId
    const matchingCensusUploads = await ctx.db
      .query("census_uploads")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.id))
      .collect();

    // Get client once to check activeCensusId
    const client = await ctx.db.get(file.clientId);
    let needsActiveCensusUpdate = false;

    // Delete census data if found
    for (const censusUpload of matchingCensusUploads) {
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

export const markFileAsVerified = mutation({
  args: {
    fileId: v.id("files"),
    verifiedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      isVerified: true,
      verifiedBy: args.verifiedBy,
      verifiedAt: Date.now(),
    });
  },
});
