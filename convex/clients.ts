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
