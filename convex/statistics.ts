import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMonthlyActivityReport = query({
  args: {
    month: v.number(), // 1-12
    year: v.number(), // e.g., 2025
  },
  returns: v.object({
    month: v.number(),
    year: v.number(),
    clientsCreated: v.number(),
    filesUploaded: v.number(),
    quotesCompleted: v.number(),
    quotesAccepted: v.number(),
    quotesDeclined: v.number(),
    censusUploads: v.number(),
    infoRequestsCreated: v.number(),
    infoRequestsResolved: v.number(),
  }),
  handler: async (ctx, { month, year }) => {
    // Calculate start and end timestamps for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    // Count clients created in this month
    const allClients = await ctx.db.query("clients").collect();
    const clientsCreated = allClients.filter(
      (c) => c._creationTime >= startTime && c._creationTime < endTime
    ).length;

    // Count files uploaded in this month
    const allFiles = await ctx.db.query("files").collect();
    const filesUploaded = allFiles.filter(
      (f) => f.uploadedAt >= startTime && f.uploadedAt < endTime
    ).length;

    // Count census uploads in this month
    const allCensus = await ctx.db.query("census_uploads").collect();
    const censusUploads = allCensus.filter(
      (c) => c.uploadedAt >= startTime && c.uploadedAt < endTime
    ).length;

    // Count quotes completed in this month (those with completedAt in range)
    const allQuotes = await ctx.db.query("quotes").collect();
    const completedQuotes = allQuotes.filter(
      (q) =>
        q.completedAt && q.completedAt >= startTime && q.completedAt < endTime
    );
    const quotesCompleted = completedQuotes.length;
    const quotesAccepted = completedQuotes.filter(
      (q) => q.status === "accepted"
    ).length;
    const quotesDeclined = completedQuotes.filter(
      (q) => q.status === "declined"
    ).length;

    // Count info requests created and resolved in this month
    const allInfoRequests = await ctx.db.query("info_requests").collect();
    const infoRequestsCreated = allInfoRequests.filter(
      (r) => r.requestedAt >= startTime && r.requestedAt < endTime
    ).length;
    const infoRequestsResolved = allInfoRequests.filter(
      (r) => r.resolvedAt && r.resolvedAt >= startTime && r.resolvedAt < endTime
    ).length;

    return {
      month,
      year,
      clientsCreated,
      filesUploaded,
      quotesCompleted,
      quotesAccepted,
      quotesDeclined,
      censusUploads,
      infoRequestsCreated,
      infoRequestsResolved,
    };
  },
});

export const getSystemStatistics = query({
  args: {},
  returns: v.object({
    totalClients: v.number(),
    activeQuotes: v.number(),
    completedQuotes: v.number(),
    averageQuoteCompletionTime: v.number(), // in days
    averageDataQualityScore: v.number(), // 0-100
    totalCensusUploads: v.number(),
    totalFiles: v.number(),
    activeInfoRequests: v.number(),
  }),
  handler: async (ctx) => {
    // Get all clients (non-archived)
    const allClients = await ctx.db
      .query("clients")
      .filter((q) =>
        q.or(
          q.eq(q.field("isArchived"), false),
          q.eq(q.field("isArchived"), undefined)
        )
      )
      .collect();
    const totalClients = allClients.length;

    // Get all quotes
    const allQuotes = await ctx.db.query("quotes").collect();

    // Active quotes (not accepted or declined)
    const activeQuotes = allQuotes.filter(
      (q) => !["accepted", "declined"].includes(q.status)
    ).length;

    // Completed quotes (accepted or declined)
    const completedQuotes = allQuotes.filter((q) =>
      ["accepted", "declined"].includes(q.status)
    ).length;

    // Calculate average quote completion time
    const quotesWithCompletionTime = allQuotes.filter(
      (q) => q.startedAt && q.completedAt
    );
    let averageQuoteCompletionTime = 0;
    if (quotesWithCompletionTime.length > 0) {
      const totalDays = quotesWithCompletionTime.reduce((sum, q) => {
        const days = (q.completedAt! - q.startedAt!) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageQuoteCompletionTime = totalDays / quotesWithCompletionTime.length;
    }

    // Get all census validations
    const allValidations = await ctx.db.query("census_validations").collect();

    // Calculate average data quality score (average of PEO and ACA scores)
    let averageDataQualityScore = 0;
    if (allValidations.length > 0) {
      const totalScore = allValidations.reduce((sum, v) => {
        // Average the PEO and ACA scores for each validation
        const avgScore = (v.peoScore + v.acaScore) / 2;
        return sum + avgScore;
      }, 0);
      averageDataQualityScore = totalScore / allValidations.length;
    }

    // Total census uploads
    const totalCensusUploads = await ctx.db
      .query("census_uploads")
      .collect()
      .then((uploads) => uploads.length);

    // Total files
    const totalFiles = await ctx.db
      .query("files")
      .collect()
      .then((files) => files.length);

    // Active info requests (pending status)
    const activeInfoRequests = await ctx.db
      .query("info_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
      .then((requests) => requests.length);

    return {
      totalClients,
      activeQuotes,
      completedQuotes,
      averageQuoteCompletionTime:
        Math.round(averageQuoteCompletionTime * 10) / 10, // Round to 1 decimal
      averageDataQualityScore: Math.round(averageDataQualityScore * 10) / 10, // Round to 1 decimal
      totalCensusUploads,
      totalFiles,
      activeInfoRequests,
    };
  },
});
