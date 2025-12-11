import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper mutation to mark a file as required (for testing purposes)
export const markFileAsRequired = mutation({
  args: {
    fileId: v.id("files"),
    isRequired: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      isRequired: args.isRequired,
    });
    return null;
  },
});
