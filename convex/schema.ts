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
    fileId: v.optional(v.id("files")),
    fileName: v.string(),
    uploadedAt: v.number(),
    columns: v.array(v.string()),
    rowCount: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_fileId", ["fileId"]),
  census_rows: defineTable({
    censusUploadId: v.id("census_uploads"),
    data: v.any(), // Flexible JSON object
    rowIndex: v.number(),
  }).index("by_censusUploadId", ["censusUploadId"]),
  quotes: defineTable({
    clientId: v.id("clients"),
    type: v.union(v.literal("PEO"), v.literal("ACA")),
    status: v.union(
      v.literal("not_started"),
      v.literal("intake"),
      v.literal("underwriting"),
      v.literal("proposal_ready"),
      v.literal("presented"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    isBlocked: v.optional(v.boolean()),
    blockedReason: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_and_type", ["clientId", "type"])
    .index("by_status", ["status"]),
  quote_history: defineTable({
    quoteId: v.id("quotes"),
    previousStatus: v.string(),
    newStatus: v.string(),
    changedAt: v.number(),
    changedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_quoteId", ["quoteId"]),
  census_validations: defineTable({
    censusUploadId: v.id("census_uploads"),
    validatedAt: v.number(),
    peoScore: v.number(),
    acaScore: v.number(),
    totalRows: v.number(),
    peoValidRows: v.number(),
    acaValidRows: v.number(),
    issues: v.array(
      v.object({
        field: v.string(),
        issueType: v.union(
          v.literal("missing_column"),
          v.literal("missing_value"),
          v.literal("invalid_value")
        ),
        affectedRows: v.array(v.number()),
        message: v.string(),
        requiredFor: v.union(
          v.literal("PEO"),
          v.literal("ACA"),
          v.literal("both")
        ),
      })
    ),
  }).index("by_censusUploadId", ["censusUploadId"]),
  comments: defineTable({
    clientId: v.id("clients"),
    targetType: v.union(
      v.literal("client"),
      v.literal("file"),
      v.literal("census")
    ),
    targetId: v.optional(v.string()),
    content: v.string(),
    authorName: v.string(),
    authorTeam: v.union(v.literal("PEO"), v.literal("ACA"), v.literal("Sales")),
    createdAt: v.number(),
    isResolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_targetType_and_targetId", ["targetType", "targetId"])
    .index("by_clientId_and_createdAt", ["clientId", "createdAt"]),
});
