import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    activeCensusId: v.optional(v.id("census_uploads")),
  }),
  files: defineTable({
    storageId: v.string(),
    clientId: v.id("clients"),
    name: v.string(),
    type: v.string(), // "PEO", "ACA", "Other"
    uploadedAt: v.number(),
  }).index("by_clientId", ["clientId"]),
  census_uploads: defineTable({
    clientId: v.id("clients"),
    fileName: v.string(),
    uploadedAt: v.number(),
    columns: v.array(v.string()),
    rowCount: v.number(),
  }).index("by_clientId", ["clientId"]),
  census_rows: defineTable({
    censusUploadId: v.id("census_uploads"),
    data: v.any(), // Flexible JSON object
    rowIndex: v.number(),
  }).index("by_censusUploadId", ["censusUploadId"]),
});
