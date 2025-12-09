# Feature: Census Data Validation

## Overview

Automatically validate uploaded census data against PEO and ACA requirements, flagging missing or invalid fields before analysts begin quoting. This prevents wasted effort on incomplete data and reduces back-and-forth with clients.

## Problem Statement

Currently, census files are parsed and displayed but not validated. Analysts discover missing data (DOBs, zip codes, salary info) only after starting their work, leading to:
- Wasted analyst time on incomplete quotes
- Multiple rounds of data requests to clients
- Delayed quote turnaround
- Inconsistent data quality standards

## User Stories

1. **As a PEO Analyst**, I want to immediately see if a census is missing required fields so I don't waste time starting a quote that will fail.

2. **As an ACA Analyst**, I need additional different validation rules than PEO since we have additional required fields differ.

3. **As an Account Manager**, I want to see a "data quality score" so I know if I need to request more info before assigning to analysts.

4. **As a Client**, I want clear guidance on exactly what data is missing so I can provide it in one request.

## Proposed Solution

### Validation Rules Engine

Define field requirements per quote type:

```typescript
// lib/census-validation.ts

type FieldRequirement = {
  field: string;
  aliases: string[];  // Alternative column names
  required: boolean;
  validator?: (value: unknown) => boolean;
  errorMessage?: string;
};

const PEO_REQUIREMENTS: FieldRequirement[] = [
  {
    field: "employee_name",
    aliases: ["name", "employee", "full name", "first name"],
    required: true,
  },
  {
    field: "date_of_birth",
    aliases: ["dob", "birth date", "birthdate", "date of birth"],
    required: true,
    validator: isValidDate,
    errorMessage: "Invalid date format",
  },
  {
    field: "zip_code",
    aliases: ["zip", "postal code", "zipcode"],
    required: true,
    validator: isValidZip,
    errorMessage: "Must be 5-digit zip code",
  },
  {
    field: "salary",
    aliases: ["annual salary", "compensation", "pay", "wage"],
    required: true,
    validator: isPositiveNumber,
  },
  {
    field: "coverage_tier",
    aliases: ["tier", "coverage", "plan tier", "ee/es/ec/fam"],
    required: true,
  },
];

const ACA_REQUIREMENTS: FieldRequirement[] = [
  // ... additional required fields
  {
    field: "hours_per_week",
    aliases: ["hours", "weekly hours", "hrs/wk"],
    required: true,
    validator: (v) => Number(v) >= 0 && Number(v) <= 168,
  },
  {
    field: "hire_date",
    aliases: ["start date", "date of hire", "employment date"],
    required: true,
    validator: isValidDate,
  },
];
```

### Validation Result Model

```typescript
// convex/schema.ts addition

census_validations: defineTable({
  censusUploadId: v.id("census_uploads"),
  validationType: v.union(v.literal("PEO"), v.literal("ACA")),
  validatedAt: v.number(),
  overallScore: v.number(), // 0-100
  totalRows: v.number(),
  validRows: v.number(),
  issues: v.array(v.object({
    field: v.string(),
    issueType: v.union(
      v.literal("missing_column"),
      v.literal("missing_value"),
      v.literal("invalid_value")
    ),
    affectedRows: v.array(v.number()), // Row indices
    message: v.string(),
  })),
}).index("by_censusUploadId", ["censusUploadId"]),
```

### UI Components

#### 1. Validation Summary Card

Displayed after census import:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Census Validation Results                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  PEO Ready: 🟡 78%          ACA Ready: 🟢 95%               │
│  ████████████░░░░            ███████████████░                │
│                                                             │
│  ⚠️ 3 Issues Found                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ❌ Missing "Salary" - 12 rows affected                  ││
│  │ ❌ Invalid ZIP codes - 3 rows (rows 5, 18, 42)          ││
│  │ ⚠️ Missing "Coverage Tier" - 8 rows affected            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [View Details]  [Request Missing Info]  [Proceed Anyway]   │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Row-Level Issue Highlighting

In the census viewer, highlight problematic cells:

```
| # | Name      | DOB        | Salary  | ZIP    |
|---|-----------|------------|---------|--------|
| 1 | John Doe  | 1985-03-15 | 65000   | 90210  |
| 2 | Jane Doe  | 1990-07-22 | [🔴]    | 90211  |  ← Missing salary
| 3 | Bob Smith | [🔴]       | 72000   | [🟡]   |  ← Invalid DOB, bad ZIP
```

#### 3. Validation Filter

Add filter to census viewer:
- Show All
- Show Valid Only
- Show Issues Only

### Convex Functions

```typescript
// convex/census-validation.ts

export const validateCensus = mutation({
  args: {
    censusUploadId: v.id("census_uploads"),
    validationType: v.union(v.literal("PEO"), v.literal("ACA")),
  },
  returns: v.id("census_validations"),
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.censusUploadId);
    if (!upload) throw new Error("Census not found");

    const rows = await ctx.db
      .query("census_rows")
      .withIndex("by_censusUploadId", (q) => 
        q.eq("censusUploadId", args.censusUploadId)
      )
      .collect();

    const requirements = args.validationType === "PEO" 
      ? PEO_REQUIREMENTS 
      : ACA_REQUIREMENTS;

    const issues = validateRows(upload.columns, rows, requirements);
    const validRows = rows.length - countAffectedRows(issues);
    const score = Math.round((validRows / rows.length) * 100);

    return await ctx.db.insert("census_validations", {
      censusUploadId: args.censusUploadId,
      validationType: args.validationType,
      validatedAt: Date.now(),
      overallScore: score,
      totalRows: rows.length,
      validRows,
      issues,
    });
  },
});

export const getValidation = query({
  args: { censusUploadId: v.id("census_uploads") },
  returns: v.union(v.null(), validationResultValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("census_validations")
      .withIndex("by_censusUploadId", (q) => 
        q.eq("censusUploadId", args.censusUploadId)
      )
      .order("desc")
      .first();
  },
});
```

### Auto-Validation Trigger

Run validation automatically after census import:

```typescript
// In census.ts saveCensus mutation, after saving rows:
await ctx.scheduler.runAfter(0, internal.censusValidation.validateBoth, {
  censusUploadId,
});
```

## Technical Approach

1. **Phase 1**: Define validation rules, add validation table, create validation mutation
2. **Phase 2**: Build validation summary UI component
3. **Phase 3**: Add row-level highlighting in census viewer
4. **Phase 4**: Auto-trigger validation on import

### Component Structure

```
components/
  census/
    census-validation-summary.tsx   # Overall validation results
    census-validation-issues.tsx    # Issue list with details
    census-row-highlight.tsx        # Cell-level issue indicators
lib/
  census-validation.ts              # Validation rules and logic
```

## Success Metrics

1. **Data Quality**: 90% of censuses pass validation before quote start
2. **Efficiency**: Reduce "missing data" quote delays by 60%
3. **Clarity**: 100% of data requests include specific field list

## Acceptance Criteria

- [ ] PEO and ACA validation rules are defined and configurable
- [ ] Validation runs automatically after census import
- [ ] Validation summary shows score and issue count
- [ ] Issues list shows affected fields and row counts
- [ ] Census viewer highlights invalid cells
- [ ] "Request Missing Info" button pre-populates with issues

## Dependencies

- Census import feature (exists)
- "Request Missing Info" workflow (separate feature)

## Effort Estimation

- **Complexity**: Medium
- **Estimated Time**: 4-5 days
- **Priority**: P0 (Critical) - Directly reduces turnaround time

## Future Enhancements

- Custom validation rules per client
- Machine learning for column name matching
- Bulk fix suggestions (e.g., "Apply default ZIP to all missing")
- Validation history tracking