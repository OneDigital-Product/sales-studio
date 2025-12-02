# Feature: Request Missing Info Workflow

## Overview

A structured workflow for requesting missing information from clients, with tracking of what was requested, when, and whether it was received. This formalizes the "waiting on client" state and provides clear accountability.

## Problem Statement

When census data is incomplete or additional documents are needed:
- Requests are made via email with no tracking
- No visibility into what's been requested vs. received
- No way to measure client response time
- Quote SLA clock keeps running even when blocked on client
- Multiple team members may request the same info

## User Stories

1. **As an Analyst**, I want to formally request missing info so the quote is marked as "waiting on client" and my SLA pauses.

2. **As an Account Manager**, I want to see all outstanding requests across my clients so I can follow up proactively.

3. **As a Sales Manager**, I want to track average client response time to identify problematic accounts.

4. **As any team member**, I want to see request history so I don't duplicate requests.

## Proposed Solution

### Data Model

```typescript
// convex/schema.ts addition

info_requests: defineTable({
  clientId: v.id("clients"),
  quoteType: v.optional(v.union(v.literal("PEO"), v.literal("ACA"))),
  status: v.union(
    v.literal("pending"),
    v.literal("received"),
    v.literal("cancelled")
  ),
  requestedAt: v.number(),
  requestedBy: v.string(), // Future: user ID
  resolvedAt: v.optional(v.number()),
  items: v.array(v.object({
    description: v.string(),
    category: v.union(
      v.literal("census_field"),
      v.literal("document"),
      v.literal("clarification"),
      v.literal("other")
    ),
    received: v.boolean(),
    receivedAt: v.optional(v.number()),
  })),
  notes: v.optional(v.string()),
  reminderSentAt: v.optional(v.number()),
})
  .index("by_clientId", ["clientId"])
  .index("by_status", ["status"])
  .index("by_clientId_and_status", ["clientId", "status"]),
```

### UI Components

#### 1. Request Missing Info Button

Prominent button on client detail page:

```
[📋 Request Missing Info]
```

Opens a modal:

```
┌─────────────────────────────────────────────────────────────┐
│  Request Missing Information                          [X]   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  For: [PEO ▼] [ACA ▼] [Both]                               │
│                                                             │
│  📊 From Census Validation:                                 │
│  ☑️ Missing Salary data (12 rows)                           │
│  ☑️ Invalid ZIP codes (3 rows)                              │
│  ☐ Missing Coverage Tier (8 rows)                          │
│                                                             │
│  📄 Additional Documents:                                   │
│  ☐ Current plan summary                                    │
│  ☐ Claims history (12 months)                              │
│  ☐ Renewal letter                                          │
│  ☑️ [+ Add custom item...]                                  │
│                                                             │
│  💬 Notes to client:                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Please provide the missing salary information for the  ││
│  │ employees listed. We need this to complete your quote. ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Cancel]                    [Send Request & Pause Quote]   │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Outstanding Requests Panel

On client detail page, show pending requests:

```
┌─────────────────────────────────────────────────────────────┐
│  ⏳ Waiting on Client                              2 items   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Requested Nov 28, 2024 (4 days ago)                        │
│                                                             │
│  ☐ Missing Salary data (12 rows)                           │
│  ☐ Current plan summary document                           │
│                                                             │
│  [Mark as Received]  [Send Reminder]  [Cancel Request]      │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Dashboard Widget

On home page, show all pending requests:

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Outstanding Info Requests                    View All → │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  🔴 Acme Corp - 4 days waiting (2 items)                    │
│  🟡 Beta Inc - 1 day waiting (1 item)                       │
│  🟢 Gamma LLC - Just requested (3 items)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Convex Functions

```typescript
// convex/info-requests.ts

export const createRequest = mutation({
  args: {
    clientId: v.id("clients"),
    quoteType: v.optional(v.union(v.literal("PEO"), v.literal("ACA"))),
    items: v.array(v.object({
      description: v.string(),
      category: categoryValidator,
    })),
    notes: v.optional(v.string()),
  },
  returns: v.id("info_requests"),
  handler: async (ctx, args) => {
    // Create request
    const requestId = await ctx.db.insert("info_requests", {
      clientId: args.clientId,
      quoteType: args.quoteType,
      status: "pending",
      requestedAt: Date.now(),
      requestedBy: "system", // Future: get from auth
      items: args.items.map(item => ({
        ...item,
        received: false,
      })),
      notes: args.notes,
    });

    // Update quote status to blocked if specified
    if (args.quoteType) {
      const quote = await ctx.db
        .query("quotes")
        .withIndex("by_clientId_and_type", (q) =>
          q.eq("clientId", args.clientId).eq("type", args.quoteType)
        )
        .unique();
      
      if (quote) {
        await ctx.db.patch(quote._id, {
          blockedReason: "Waiting on client info",
        });
      }
    }

    return requestId;
  },
});

export const markItemReceived = mutation({
  args: {
    requestId: v.id("info_requests"),
    itemIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    const items = [...request.items];
    items[args.itemIndex] = {
      ...items[args.itemIndex],
      received: true,
      receivedAt: Date.now(),
    };

    const allReceived = items.every(item => item.received);

    await ctx.db.patch(args.requestId, {
      items,
      status: allReceived ? "received" : "pending",
      resolvedAt: allReceived ? Date.now() : undefined,
    });

    // Clear quote blocked status if all received
    if (allReceived && request.quoteType) {
      const quote = await ctx.db
        .query("quotes")
        .withIndex("by_clientId_and_type", (q) =>
          q.eq("clientId", request.clientId).eq("type", request.quoteType)
        )
        .unique();
      
      if (quote) {
        await ctx.db.patch(quote._id, { blockedReason: undefined });
      }
    }

    return null;
  },
});

export const getPendingRequests = query({
  args: { clientId: v.optional(v.id("clients")) },
  returns: v.array(requestValidator),
  handler: async (ctx, args) => {
    if (args.clientId) {
      return await ctx.db
        .query("info_requests")
        .withIndex("by_clientId_and_status", (q) =>
          q.eq("clientId", args.clientId).eq("status", "pending")
        )
        .collect();
    }
    
    return await ctx.db
      .query("info_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});
```

### Integration with Census Validation

Pre-populate request items from validation issues:

```typescript
// When opening request modal, fetch validation issues
const validation = useQuery(api.censusValidation.getValidation, { 
  censusUploadId 
});

// Convert to request items
const suggestedItems = validation?.issues.map(issue => ({
  description: `${issue.field}: ${issue.message} (${issue.affectedRows.length} rows)`,
  category: "census_field" as const,
}));
```

## Technical Approach

1. **Phase 1**: Data model, create/list requests
2. **Phase 2**: Request modal with validation integration
3. **Phase 3**: Mark received workflow, quote status integration
4. **Phase 4**: Dashboard widget, reminder functionality

### Component Structure

```
components/
  info-requests/
    request-modal.tsx           # Create new request
    pending-requests-panel.tsx  # Show on client page
    request-item-checkbox.tsx   # Individual item toggle
    requests-dashboard.tsx      # Home page widget
```

## Success Metrics

1. **Tracking**: 100% of info requests are logged in system
2. **Response Time**: Measure and display average client response time
3. **Visibility**: Reduce duplicate requests by 90%
4. **SLA Accuracy**: Quote SLA excludes "waiting on client" time

## Acceptance Criteria

- [ ] "Request Missing Info" button on client detail page
- [ ] Modal pre-populates with census validation issues
- [ ] Custom items can be added to request
- [ ] Pending requests visible on client page
- [ ] Individual items can be marked as received
- [ ] Quote status updates to "blocked" when request created
- [ ] Dashboard shows all pending requests across clients
- [ ] Request history preserved for audit

## Dependencies

- Quote Status Dashboard (for blocked status integration)
- Census Validation (for pre-populating items)

## Effort Estimation

- **Complexity**: Medium
- **Estimated Time**: 4-5 days
- **Priority**: P1 (High) - Key workflow improvement

## Future Enhancements

- Email/SMS notifications to clients
- Automated reminders after X days
- Client portal for self-service uploads
- Integration with email to auto-detect responses
