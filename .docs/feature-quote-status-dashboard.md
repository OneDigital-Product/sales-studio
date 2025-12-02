# Feature: Quote Status Dashboard

## Overview

Transform the client detail page into a comprehensive Quote Workspace with visual status tracking for both PEO and ACA quotes, enabling Account Managers to instantly see quote progress and identify bottlenecks.

## Problem Statement

Currently, the client detail page shows files and census data but provides no visibility into quote status. Account Managers have no way to:
- See if a quote is in progress, stuck, or complete
- Understand which team (PEO or ACA) is working on what
- Identify blockers preventing quote completion
- Track time-to-quote metrics

This leads to constant status check emails/calls and delayed responses to clients.

## User Stories

1. **As an Account Manager**, I want to see at-a-glance status for both PEO and ACA quotes so I can quickly update clients on progress.

2. **As a PEO Analyst**, I want to update quote status as I work so my progress is visible to the team.

3. **As an ACA Analyst**, I want to see if the PEO team has started their quote so I can coordinate timing.

4. **As a Sales Manager**, I want to see which quotes are stuck so I can intervene and remove blockers.

## Proposed Solution

### Data Model Changes

Add to `convex/schema.ts`:

```typescript
// New table for quote tracking
quotes: defineTable({
  clientId: v.id("clients"),
  type: v.union(v.literal("PEO"), v.literal("ACA")),
  status: v.union(
    v.literal("not_started"),
    v.literal("intake"),
    v.literal("underwriting"),
    v.literal("proposal_ready"),
    v.literal("presented"),
    v.literal("won"),
    v.literal("lost")
  ),
  assignedTo: v.optional(v.string()), // Future: user ID
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  blockedReason: v.optional(v.string()),
})
  .index("by_clientId", ["clientId"])
  .index("by_clientId_and_type", ["clientId", "type"])
  .index("by_status", ["status"]),
```

### UI Components

#### 1. Quote Status Cards (Client Detail Page)

Two side-by-side cards showing PEO and ACA quote status:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  🟢 PEO Quote               │  │  🟡 ACA Quote               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Status: Underwriting       │  │  Status: Intake             │
│  Started: 2 days ago        │  │  Started: Today             │
│  Assigned: John D.          │  │  Assigned: —                │
│                             │  │                             │
│  [Update Status ▼]          │  │  [Start Quote]              │
└─────────────────────────────┘  └─────────────────────────────┘
```

#### 2. Status Progress Indicator

Visual pipeline showing stages:
```
○ Not Started → ● Intake → ● Underwriting → ○ Proposal → ○ Presented
```

#### 3. Status Update Dropdown

Quick status change with optional note:
- Dropdown with all status options
- Optional "Add note" field for context
- Automatic timestamp tracking

### Convex Functions

```typescript
// convex/quotes.ts

export const getQuotes = query({
  args: { clientId: v.id("clients") },
  returns: v.array(quoteValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotes")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const updateQuoteStatus = mutation({
  args: {
    clientId: v.id("clients"),
    type: v.union(v.literal("PEO"), v.literal("ACA")),
    status: statusValidator,
    notes: v.optional(v.string()),
    blockedReason: v.optional(v.string()),
  },
  returns: v.id("quotes"),
  handler: async (ctx, args) => {
    // Find or create quote
    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_clientId_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("type", args.type)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        notes: args.notes,
        blockedReason: args.blockedReason,
        completedAt: args.status === "won" || args.status === "lost" 
          ? Date.now() 
          : undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("quotes", {
      clientId: args.clientId,
      type: args.type,
      status: args.status,
      startedAt: Date.now(),
      notes: args.notes,
    });
  },
});
```

### Dashboard View (Home Page Enhancement)

Add a summary view showing all active quotes:

| Client | PEO Status | ACA Status | Days Open | Action |
|--------|------------|------------|-----------|--------|
| Acme Corp | 🟡 Underwriting | 🟢 Proposal Ready | 3 | View |
| Beta Inc | 🔴 Blocked | ⚪ Not Started | 7 | View |

Filter options:
- All / PEO Only / ACA Only
- By Status
- Blocked Only
- My Quotes (future)

## Technical Approach

1. **Phase 1**: Add schema, basic CRUD mutations, status cards on client page
2. **Phase 2**: Dashboard summary view with filtering
3. **Phase 3**: Status history tracking (audit log)

### Component Structure

```
components/
  quotes/
    quote-status-card.tsx      # Individual quote status display
    quote-status-update.tsx    # Status update dropdown/form
    quote-progress-bar.tsx     # Visual pipeline indicator
    quotes-dashboard.tsx       # Home page summary table
```

## Success Metrics

1. **Adoption**: 80% of quotes have status updated within 24h of activity
2. **Visibility**: Reduce "what's the status?" inquiries by 50%
3. **Speed**: Identify blocked quotes within 1 day (vs. current unknown)

## Acceptance Criteria

- [ ] PEO and ACA quote status cards visible on client detail page
- [ ] Status can be updated via dropdown with optional notes
- [ ] Status changes are timestamped automatically
- [ ] Dashboard shows all clients with quote status summary
- [ ] Blocked quotes are visually highlighted
- [ ] Status history is preserved (not just current state)

## Dependencies

- None (can be built independently)

## Effort Estimation

- **Complexity**: Medium
- **Estimated Time**: 3-4 days
- **Priority**: P0 (Critical) - Core to business goal

## Future Enhancements

- User assignment and "My Quotes" view
- SLA tracking with alerts
- Quote status change notifications
- Integration with external quoting systems
