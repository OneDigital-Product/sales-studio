import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    contactEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    activeCensusId: v.optional(v.id("census_uploads")),
    lastModified: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    archivedAt: v.optional(v.number()),
  }),
  files: defineTable({
    storageId: v.string(),
    clientId: v.id("clients"),
    name: v.string(),
    type: v.string(), // "PEO", "ACA", "Other" - keeping for backwards compatibility
    uploadedAt: v.number(),
    // Enhanced fields for file categorization
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
    isRequired: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    uploadedBy: v.optional(v.string()),
    description: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_and_category", ["clientId", "category"]),
  census_uploads: defineTable({
    clientId: v.id("clients"),
    fileId: v.optional(v.id("files")),
    fileName: v.string(),
    uploadedAt: v.number(),
    columns: v.array(v.string()),
    rowCount: v.number(),
    // Track pending batch insertions for large imports
    pendingBatches: v.optional(v.number()),
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
  info_requests: defineTable({
    clientId: v.id("clients"),
    title: v.optional(v.string()),
    quoteType: v.optional(
      v.union(v.literal("PEO"), v.literal("ACA"), v.literal("both"))
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("received"),
      v.literal("cancelled")
    ),
    requestedAt: v.number(),
    requestedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    items: v.array(
      v.object({
        description: v.string(),
        category: v.optional(v.string()),
        received: v.boolean(),
        receivedAt: v.optional(v.number()),
      })
    ),
    notes: v.optional(v.string()),
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_status", ["status"])
    .index("by_clientId_and_status", ["clientId", "status"]),
  bookmarks: defineTable({
    clientId: v.id("clients"),
    bookmarkedAt: v.number(),
  }).index("by_clientId", ["clientId"]),
});
