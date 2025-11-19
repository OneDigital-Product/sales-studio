import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createClient = mutation({
  args: {
    name: v.string(),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
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
  handler: async (ctx) => await ctx.db.query("clients").collect(),
});

export const getClient = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});
