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

    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(args.id);
  },
});
