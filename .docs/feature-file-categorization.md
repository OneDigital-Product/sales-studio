# Feature: Smart File Categorization & Document Center

## Overview

Transform the simple file list into an organized Document Center with automatic categorization, tagging, and quick access to commonly needed documents. This ensures both PEO and ACA teams can instantly find the files they need.

## Problem Statement

Currently, files are stored with minimal metadata:
- Only "Census" or "Quote Data" types
- No categorization by document purpose
- No way to mark files as "required" vs "supplemental"
- Both teams see the same flat list with no organization
- Hard to tell if all required documents are present

## User Stories

1. **As a PEO Analyst**, I want to quickly find the current plan summary so I don't waste time searching through files.

2. **As an ACA Analyst**, I want to see which required documents are missing so I know what to request.

3. **As an Account Manager**, I want files automatically categorized so I don't have to manually organize them.

4. **As any team member**, I want to filter files by category so I only see what's relevant to my work.

## Proposed Solution

### Enhanced Data Model

```typescript
// Update files table in convex/schema.ts

files: defineTable({
  storageId: v.string(),
  clientId: v.id("clients"),
  name: v.string(),
  
  // Enhanced categorization
  category: v.union(
    v.literal("census"),
    v.literal("plan_summary"),
    v.literal("claims_history"),
    v.literal("renewal_letter"),
    v.literal("proposal"),
    v.literal("contract"),
    v.literal("other")
  ),
  
  // Relevance to teams
  relevantTo: v.array(v.union(v.literal("PEO"), v.literal("ACA"))),
  
  // Document status
  isRequired: v.boolean(),
  isVerified: v.optional(v.boolean()),
  verifiedBy: v.optional(v.string()),
  verifiedAt: v.optional(v.number()),
  
  // Metadata
  uploadedAt: v.number(),
  uploadedBy: v.optional(v.string()),
  description: v.optional(v.string()),
  
  // File info
  mimeType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
})
  .index("by_clientId", ["clientId"])
  .index("by_clientId_and_category", ["clientId", "category"]),
```

### Document Requirements Definition

```typescript
// lib/document-requirements.ts

type DocumentRequirement = {
  category: FileCategory;
  name: string;
  description: string;
  requiredFor: ("PEO" | "ACA")[];
  filePatterns: string[];  // For auto-detection
  keywords: string[];      // For content-based detection
};

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    category: "census",
    name: "Employee Census",
    description: "Complete employee roster with demographics",
    requiredFor: ["PEO", "ACA"],
    filePatterns: ["census", "roster", "employee"],
    keywords: ["dob", "salary", "zip", "coverage"],
  },
  {
    category: "plan_summary",
    name: "Current Plan Summary",
    description: "Summary of benefits for current health plan",
    requiredFor: ["PEO", "ACA"],
    filePatterns: ["sbc", "summary", "plan", "benefit"],
    keywords: ["deductible", "copay", "coinsurance", "out-of-pocket"],
  },
  {
    category: "claims_history",
    name: "Claims History",
    description: "12-month claims experience report",
    requiredFor: ["PEO"],
    filePatterns: ["claims", "experience", "loss"],
    keywords: ["paid claims", "incurred", "large claims"],
  },
  {
    category: "renewal_letter",
    name: "Renewal Letter",
    description: "Current carrier's renewal offer",
    requiredFor: ["PEO", "ACA"],
    filePatterns: ["renewal", "rate"],
    keywords: ["renewal rate", "effective date", "premium"],
  },
];
```

### Auto-Categorization Logic

```typescript
// lib/file-categorization.ts

export const detectCategory = async (
  file: File,
  content?: string
): Promise<FileCategory> => {
  const fileName = file.name.toLowerCase();
  
  // Check filename patterns
  for (const req of DOCUMENT_REQUIREMENTS) {
    if (req.filePatterns.some(pattern => fileName.includes(pattern))) {
      return req.category;
    }
  }
  
  // Check content keywords (for text-based files)
  if (content) {
    const lowerContent = content.toLowerCase();
    for (const req of DOCUMENT_REQUIREMENTS) {
      const matchCount = req.keywords.filter(kw => 
        lowerContent.includes(kw)
      ).length;
      if (matchCount >= 2) {
        return req.category;
      }
    }
  }
  
  return "other";
};
```

### UI Components

#### 1. Document Center (Replaces File List)

Organized view with categories:

```
┌─────────────────────────────────────────────────────────────┐
│  📁 Document Center                    [Upload] [Filter ▼]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Required Documents                              3/4 ✓      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ Employee Census                                      ││
│  │    Q4_Census.xlsx • Uploaded Nov 25 • PEO, ACA         ││
│  │                                                         ││
│  │ ✅ Current Plan Summary                                 ││
│  │    2024_SBC.pdf • Uploaded Nov 24 • PEO, ACA           ││
│  │                                                         ││
│  │ ✅ Claims History                                       ││
│  │    Claims_Report_2024.xlsx • Uploaded Nov 26 • PEO     ││
│  │                                                         ││
│  │ ❌ Renewal Letter                                       ││
│  │    Not uploaded • Required for PEO, ACA                ││
│  │    [Request from Client]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Other Documents                                   2 files  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📄 Meeting_Notes.docx • Nov 20                         ││
│  │ 📄 Org_Chart.pdf • Nov 18                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 2. Document Completeness Indicator

Quick status on client card (home page):

```
┌─────────────────────────────────────────────────────────────┐
│  Acme Corp                                                  │
│  📧 contact@acme.com                                        │
│                                                             │
│  📁 Documents: ████████░░ 3/4 required                      │
│  Missing: Renewal Letter                                    │
│                                                             │
│  [Manage Quote]                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Upload with Category Selection

Enhanced upload flow:

```
┌─────────────────────────────────────────────────────────────┐
│  Upload Document                                      [X]   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  📄 Claims_2024.xlsx                                        │
│                                                             │
│  Detected Category: Claims History ✓                        │
│  [Change Category ▼]                                        │
│                                                             │
│  Relevant to:                                               │
│  ☑️ PEO    ☐ ACA                                            │
│                                                             │
│  Description (optional):                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 12-month claims report from BlueCross                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancel]                                    [Upload File]  │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Filter Bar

Quick filters for document view:

```
[All] [Census] [Plan Docs] [Claims] [Required Only] [PEO] [ACA]
```

### Convex Functions

```typescript
// convex/files.ts updates

export const saveFileWithCategory = mutation({
  args: {
    storageId: v.string(),
    clientId: v.id("clients"),
    name: v.string(),
    category: categoryValidator,
    relevantTo: v.array(v.union(v.literal("PEO"), v.literal("ACA"))),
    description: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    const isRequired = DOCUMENT_REQUIREMENTS
      .find(r => r.category === args.category)?.requiredFor
      .some(team => args.relevantTo.includes(team)) ?? false;

    return await ctx.db.insert("files", {
      ...args,
      isRequired,
      uploadedAt: Date.now(),
    });
  },
});

export const getDocumentCompleteness = query({
  args: { clientId: v.id("clients") },
  returns: v.object({
    required: v.number(),
    uploaded: v.number(),
    missing: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const uploadedCategories = new Set(files.map(f => f.category));
    const requiredDocs = DOCUMENT_REQUIREMENTS.filter(r => 
      r.requiredFor.length > 0
    );
    
    const missing = requiredDocs
      .filter(r => !uploadedCategories.has(r.category))
      .map(r => r.name);

    return {
      required: requiredDocs.length,
      uploaded: requiredDocs.filter(r => uploadedCategories.has(r.category)).length,
      missing,
    };
  },
});

export const getFilesByCategory = query({
  args: {
    clientId: v.id("clients"),
    category: v.optional(categoryValidator),
    relevantTo: v.optional(v.union(v.literal("PEO"), v.literal("ACA"))),
  },
  returns: v.array(fileValidator),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("files")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId));

    const files = await query.collect();
    
    return files.filter(f => {
      if (args.category && f.category !== args.category) return false;
      if (args.relevantTo && !f.relevantTo.includes(args.relevantTo)) return false;
      return true;
    });
  },
});
```

## Technical Approach

1. **Phase 1**: Update schema, add category to upload flow
2. **Phase 2**: Auto-detection logic for categorization
3. **Phase 3**: Document Center UI with grouped view
4. **Phase 4**: Completeness tracking and missing doc indicators

### Component Structure

```
components/
  documents/
    document-center.tsx         # Main organized view
    document-category-group.tsx # Collapsible category section
    document-upload-modal.tsx   # Enhanced upload with category
    document-completeness.tsx   # Progress indicator
    document-filters.tsx        # Filter bar
lib/
  document-requirements.ts      # Requirement definitions
  file-categorization.ts        # Auto-detection logic
```

## Success Metrics

1. **Organization**: 90% of files correctly categorized
2. **Completeness**: Track % of clients with all required docs
3. **Efficiency**: Reduce time to find specific documents by 70%

## Acceptance Criteria

- [ ] Files are auto-categorized on upload based on name/content
- [ ] Users can override auto-detected category
- [ ] Document Center shows files grouped by category
- [ ] Required documents show checkmark or missing indicator
- [ ] Filter bar allows filtering by category and team
- [ ] Client cards show document completeness progress
- [ ] Missing required docs can trigger info request

## Dependencies

- Request Missing Info workflow (for "Request from Client" button)

## Effort Estimation

- **Complexity**: Medium
- **Estimated Time**: 4-5 days
- **Priority**: P2 (Medium) - Improves organization

## Future Enhancements

- OCR for PDF content analysis
- Document versioning (replace vs. add new)
- Document expiration tracking
- Template documents library
- Bulk upload with batch categorization
