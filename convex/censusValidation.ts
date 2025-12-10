import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// ============================================================================
// Types
// ============================================================================

type FieldRequirement = {
  field: string;
  aliases: string[];
  required: boolean;
  validator?: (value: unknown) => boolean;
  errorMessage?: string;
  peoRequired: boolean;
  acaRequired: boolean;
};

type ValidationIssue = {
  field: string;
  issueType: "missing_column" | "missing_value" | "invalid_value";
  affectedRows: number[];
  message: string;
  requiredFor: "PEO" | "ACA" | "both";
};

// ============================================================================
// Validators
// ============================================================================

// Top-level regex patterns for better performance
const DATE_PATTERN_ISO = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const DATE_PATTERN_US = /^\d{2}\/\d{2}\/\d{4}$/; // MM/DD/YYYY
const DATE_PATTERN_DASH = /^\d{2}-\d{2}-\d{4}$/; // MM-DD-YYYY
const DATE_PATTERN_SHORT = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/; // M/D/YY or M/D/YYYY
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

const DATE_PATTERNS = [
  DATE_PATTERN_ISO,
  DATE_PATTERN_US,
  DATE_PATTERN_DASH,
  DATE_PATTERN_SHORT,
];

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === "";

const isValidDate = (value: unknown): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }
  const str = String(value);
  if (!DATE_PATTERNS.some((p) => p.test(str))) {
    return false;
  }
  const parsed = Date.parse(str);
  return !Number.isNaN(parsed);
};

const isValidZip = (value: unknown): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }
  const str = String(value).trim();
  return ZIP_PATTERN.test(str);
};

const isPositiveNumber = (value: unknown): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }
  const num = Number(String(value).replace(/[$,]/g, ""));
  return !Number.isNaN(num) && num > 0;
};

const isValidHoursPerWeek = (value: unknown): boolean => {
  if (isEmptyValue(value)) {
    return false;
  }
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0 && num <= 168;
};

const isNonEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  const str = String(value).trim();
  return str.length > 0;
};

// ============================================================================
// Field Requirements
// ============================================================================

const FIELD_REQUIREMENTS: FieldRequirement[] = [
  {
    field: "employee_name",
    aliases: ["name", "employee", "full name", "first name", "employee name"],
    required: true,
    validator: isNonEmpty,
    errorMessage: "Employee name is required",
    peoRequired: true,
    acaRequired: true,
  },
  {
    field: "date_of_birth",
    aliases: ["dob", "birth date", "birthdate", "date of birth"],
    required: true,
    validator: isValidDate,
    errorMessage: "Invalid date format",
    peoRequired: true,
    acaRequired: true,
  },
  {
    field: "zip_code",
    aliases: ["zip", "postal code", "zipcode", "zip code"],
    required: true,
    validator: isValidZip,
    errorMessage: "Must be 5-digit zip code",
    peoRequired: true,
    acaRequired: true,
  },
  {
    field: "salary",
    aliases: ["annual salary", "compensation", "pay", "wage", "salary"],
    required: true,
    validator: isPositiveNumber,
    errorMessage: "Must be a positive number",
    peoRequired: true,
    acaRequired: true,
  },
  {
    field: "coverage_tier",
    aliases: ["tier", "coverage", "plan tier", "ee/es/ec/fam", "coverage tier"],
    required: true,
    validator: isNonEmpty,
    errorMessage: "Coverage tier is required",
    peoRequired: true,
    acaRequired: true,
  },
  {
    field: "hours_per_week",
    aliases: ["hours", "weekly hours", "hrs/wk", "hours per week"],
    required: true,
    validator: isValidHoursPerWeek,
    errorMessage: "Must be between 0 and 168 hours",
    peoRequired: false,
    acaRequired: true,
  },
  {
    field: "hire_date",
    aliases: ["start date", "date of hire", "employment date", "hire date"],
    required: true,
    validator: isValidDate,
    errorMessage: "Invalid date format",
    peoRequired: false,
    acaRequired: true,
  },
];

// ============================================================================
// Validation Logic
// ============================================================================

const normalizeColumnName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, " ");

const findMatchingColumn = (
  columns: string[],
  requirement: FieldRequirement
): string | null => {
  const normalizedColumns = columns.map(normalizeColumnName);
  const candidates = [requirement.field, ...requirement.aliases].map(
    normalizeColumnName
  );

  for (const candidate of candidates) {
    const index = normalizedColumns.indexOf(candidate);
    if (index !== -1) {
      return columns[index];
    }
  }
  return null;
};

const getRequiredFor = (req: FieldRequirement): "PEO" | "ACA" | "both" => {
  if (req.peoRequired && req.acaRequired) {
    return "both";
  }
  if (req.peoRequired) {
    return "PEO";
  }
  return "ACA";
};

const validateRows = (
  columns: string[],
  rows: Array<{ data: Record<string, unknown>; rowIndex: number }>,
  requirements: FieldRequirement[]
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const requirement of requirements) {
    const matchedColumn = findMatchingColumn(columns, requirement);

    if (!matchedColumn) {
      // Missing column entirely
      issues.push({
        field: requirement.field,
        issueType: "missing_column",
        affectedRows: rows.map((r) => r.rowIndex),
        message: `Column "${requirement.field}" not found`,
        requiredFor: getRequiredFor(requirement),
      });
      continue;
    }

    // Check each row for missing/invalid values
    const missingRows: number[] = [];
    const invalidRows: number[] = [];

    for (const row of rows) {
      const value = row.data[matchedColumn];

      if (value === null || value === undefined || value === "") {
        missingRows.push(row.rowIndex);
      } else if (requirement.validator && !requirement.validator(value)) {
        invalidRows.push(row.rowIndex);
      }
    }

    if (missingRows.length > 0) {
      issues.push({
        field: requirement.field,
        issueType: "missing_value",
        affectedRows: missingRows,
        message: `Missing "${requirement.field}" value`,
        requiredFor: getRequiredFor(requirement),
      });
    }

    if (invalidRows.length > 0) {
      issues.push({
        field: requirement.field,
        issueType: "invalid_value",
        affectedRows: invalidRows,
        message: requirement.errorMessage ?? `Invalid "${requirement.field}"`,
        requiredFor: getRequiredFor(requirement),
      });
    }
  }

  return issues;
};

const calculateScores = (
  totalRows: number,
  issues: ValidationIssue[]
): {
  peoScore: number;
  acaScore: number;
  peoValidRows: number;
  acaValidRows: number;
} => {
  if (totalRows === 0) {
    return { peoScore: 100, acaScore: 100, peoValidRows: 0, acaValidRows: 0 };
  }

  // Collect rows with issues for each type
  const peoIssueRows = new Set<number>();
  const acaIssueRows = new Set<number>();

  for (const issue of issues) {
    if (issue.requiredFor === "PEO" || issue.requiredFor === "both") {
      for (const row of issue.affectedRows) {
        peoIssueRows.add(row);
      }
    }
    if (issue.requiredFor === "ACA" || issue.requiredFor === "both") {
      for (const row of issue.affectedRows) {
        acaIssueRows.add(row);
      }
    }
  }

  const peoValidRows = totalRows - peoIssueRows.size;
  const acaValidRows = totalRows - acaIssueRows.size;

  return {
    peoScore: Math.round((peoValidRows / totalRows) * 100),
    acaScore: Math.round((acaValidRows / totalRows) * 100),
    peoValidRows,
    acaValidRows,
  };
};

// ============================================================================
// Convex Functions
// ============================================================================

export const validateCensus = mutation({
  args: {
    censusUploadId: v.id("census_uploads"),
  },
  returns: v.id("census_validations"),
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.censusUploadId);
    if (!upload) {
      throw new Error("Census upload not found");
    }

    // Get all rows for this census
    const rows = await ctx.db
      .query("census_rows")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .collect();

    // Run validation
    const issues = validateRows(upload.columns, rows, FIELD_REQUIREMENTS);
    const { peoScore, acaScore, peoValidRows, acaValidRows } = calculateScores(
      rows.length,
      issues
    );

    // Check for existing validation to replace
    const existing = await ctx.db
      .query("census_validations")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new validation
    const validationId = await ctx.db.insert("census_validations", {
      censusUploadId: args.censusUploadId,
      validatedAt: Date.now(),
      peoScore,
      acaScore,
      totalRows: rows.length,
      peoValidRows,
      acaValidRows,
      issues,
    });

    return validationId;
  },
});

export const runValidation = internalMutation({
  args: {
    censusUploadId: v.id("census_uploads"),
  },
  returns: v.id("census_validations"),
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.censusUploadId);
    if (!upload) {
      throw new Error("Census upload not found");
    }

    // Get all rows for this census
    const rows = await ctx.db
      .query("census_rows")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .collect();

    // Run validation
    const issues = validateRows(upload.columns, rows, FIELD_REQUIREMENTS);
    const { peoScore, acaScore, peoValidRows, acaValidRows } = calculateScores(
      rows.length,
      issues
    );

    // Check for existing validation to replace
    const existing = await ctx.db
      .query("census_validations")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert new validation
    const validationId = await ctx.db.insert("census_validations", {
      censusUploadId: args.censusUploadId,
      validatedAt: Date.now(),
      peoScore,
      acaScore,
      totalRows: rows.length,
      peoValidRows,
      acaValidRows,
      issues,
    });

    return validationId;
  },
});

export const getValidation = query({
  args: {
    censusUploadId: v.id("census_uploads"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("census_validations"),
      _creationTime: v.number(),
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
    })
  ),
  handler: async (ctx, args) =>
    await ctx.db
      .query("census_validations")
      .withIndex("by_censusUploadId", (q) =>
        q.eq("censusUploadId", args.censusUploadId)
      )
      .first(),
});

export const getQualityHistory = query({
  args: {
    clientId: v.id("clients"),
  },
  returns: v.array(
    v.object({
      censusUploadId: v.id("census_uploads"),
      fileName: v.string(),
      uploadedAt: v.number(),
      validatedAt: v.number(),
      peoScore: v.number(),
      acaScore: v.number(),
      totalRows: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all census uploads for this client
    const censusUploads = await ctx.db
      .query("census_uploads")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("asc")
      .collect();

    // Get validations for each census upload
    const qualityHistory = await Promise.all(
      censusUploads.map(async (upload) => {
        const validation = await ctx.db
          .query("census_validations")
          .withIndex("by_censusUploadId", (q) =>
            q.eq("censusUploadId", upload._id)
          )
          .first();

        if (!validation) {
          return null;
        }

        return {
          censusUploadId: upload._id,
          fileName: upload.fileName,
          uploadedAt: upload.uploadedAt,
          validatedAt: validation.validatedAt,
          peoScore: validation.peoScore,
          acaScore: validation.acaScore,
          totalRows: validation.totalRows,
        };
      })
    );

    // Filter out null values (uploads without validations) and return sorted by date
    return qualityHistory.filter((q) => q !== null) as Array<{
      censusUploadId: (typeof censusUploads)[0]["_id"];
      fileName: string;
      uploadedAt: number;
      validatedAt: number;
      peoScore: number;
      acaScore: number;
      totalRows: number;
    }>;
  },
});
