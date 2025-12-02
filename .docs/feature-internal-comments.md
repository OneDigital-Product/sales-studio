# Feature: Internal Comments & Notes

## Overview

Enable PEO and ACA team members to leave contextual comments on clients, files, and census data. This creates an asynchronous communication channel that keeps all context in one place and reduces meetings.

## Problem Statement

Currently, cross-team communication happens via:
- Email threads that get lost
- Slack messages without context
- Meetings to discuss specific client issues
- Verbal handoffs that aren't documented

This leads to:
- Lost context when team members change
- Repeated questions about the same issues
- No audit trail of decisions
- Difficulty onboarding new team members

## User Stories

1. **As a PEO Analyst**, I want to leave a note about a census issue so the ACA team knows about it without me having to message them directly.

2. **As an Account Manager**, I want to see all comments on a client in one place so I have full context before a client call.

3. **As an ACA Analyst**, I want to comment on a specific file to explain why it's relevant or flag issues.

4. **As a new team member**, I want to read the comment history to understand a client's situation quickly.

## Proposed Solution

### Data Model

```typescript
// convex/schema.ts addition

comments: defineTable({
  // Polymorphic reference - comment can be on client, file, or census
  targetType: v.union(
    v.literal("client"),
    v.literal("file"),
    v.literal("census")
  ),
  targetId: v.string(), // ID of the target document
  clientId: v.id("clients"), // Always track client for filtering
  
  content: v.string(),
  authorName: v.string(), // Future: user ID
  authorTeam: v.optional(v.union(v.literal("PEO"), v.literal("ACA"), v.literal("Sales"))),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  
  // Optional metadata
  isResolved: v.optional(v.boolean()),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.string()),
  
  // Mentions (future)
  mentions: v.optional(v.array(v.string())),
})
  .index("by_clientId", ["clientId"])
  .index("by_targetType_and_targetId", ["targetType", "targetId"])
  .index("by_clientId_and_createdAt", ["clientId", "createdAt"]),
```

### UI Components

#### 1. Comment Thread (Client Level)

Activity feed on client detail page:

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Activity & Comments                           View All  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟢 John D. (PEO) • 2 hours ago                         ││
│  │ Census looks good for PEO. Note: they have 3 employees ││
│  │ in CA which affects workers comp rates.                ││
│  │                                          [Reply] [✓]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟣 Sarah M. (ACA) • Yesterday                          ││
│  │ Re: Q4_Census.xlsx                                     ││
│  │ This census is missing hours/week for 8 employees.     ││
│  │ Requested from client.                                 ││
│  │                                          [Reply] [✓]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Write a comment...                                     ││
│  │                                                        ││
│  │ [PEO ▼]                                    [Post]      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 2. File-Level Comments

Comment icon on file row, expandable:

```
| Name              | Comments | Action |
|-------------------|----------|--------|
| Q4_Census.xlsx    | 💬 2     | ⬇️ 🗑️  |
| Plan_Summary.pdf  | —        | ⬇️ 🗑️  |
```

Clicking opens inline comment thread:

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Q4_Census.xlsx                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  💬 Sarah M.: Missing hours data for 8 employees            │
│  💬 John D.: Client confirmed they'll send updated version  │
│                                                             │
│  [Add comment...]                                           │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Census Row Comments

Allow comments on specific census rows (for edge cases):

```
| # | Name      | DOB        | 💬 |
|---|-----------|------------|-----|
| 1 | John Doe  | 1985-03-15 |     |
| 2 | Jane Doe  | 1990-07-22 | 💬1 |  ← "Verify DOB with client"
```

#### 4. Comment Composer

Rich text input with team badge:

```
┌─────────────────────────────────────────────────────────────┐
│ [PEO ▼]  Write a comment...                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Cancel]                                           [Post]   │
└─────────────────────────────────────────────────────────────┘
```

### Convex Functions

```typescript
// convex/comments.ts

export const addComment = mutation({
  args: {
    targetType: v.union(v.literal("client"), v.literal("file"), v.literal("census")),
    targetId: v.string(),
    clientId: v.id("clients"),
    content: v.string(),
    authorName: v.string(),
    authorTeam: v.optional(v.union(v.literal("PEO"), v.literal("ACA"), v.literal("Sales"))),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getComments = query({
  args: {
    clientId: v.id("clients"),
    targetType: v.optional(v.union(v.literal("client"), v.literal("file"), v.literal("census"))),
    targetId: v.optional(v.string()),
  },
  returns: v.array(commentValidator),
  handler: async (ctx, args) => {
    if (args.targetType && args.targetId) {
      return await ctx.db
        .query("comments")
        .withIndex("by_targetType_and_targetId", (q) =>
          q.eq("targetType", args.targetType).eq("targetId", args.targetId)
        )
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("comments")
      .withIndex("by_clientId_and_createdAt", (q) =>
        q.eq("clientId", args.clientId)
      )
      .order("desc")
      .take(50);
  },
});

export const resolveComment = mutation({
  args: {
    commentId: v.id("comments"),
    resolvedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      isResolved: true,
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    });
    return null;
  },
});

export const getCommentCounts = query({
  args: { clientId: v.id("clients") },
  returns: v.record(v.string(), v.number()),
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    const counts: Record<string, number> = {};
    for (const comment of comments) {
      const key = `${comment.targetType}:${comment.targetId}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  },
});
```

### Real-Time Updates

Comments use Convex's real-time sync, so new comments appear instantly for all viewers.

## Technical Approach

1. **Phase 1**: Data model, client-level comments
2. **Phase 2**: File-level comments with counts
3. **Phase 3**: Comment resolution workflow
4. **Phase 4**: Census row comments (optional)

### Component Structure

```
components/
  comments/
    comment-thread.tsx        # List of comments
    comment-composer.tsx      # Input for new comment
    comment-item.tsx          # Single comment display
    comment-badge.tsx         # Count indicator for files
```

## Success Metrics

1. **Adoption**: 70% of clients have at least one comment
2. **Context**: Reduce "what's the status?" questions by 40%
3. **Efficiency**: Decrease meeting time for client handoffs by 30%

## Acceptance Criteria

- [ ] Comments can be added at client level
- [ ] Comments can be added on specific files
- [ ] Comments show author name and team badge
- [ ] Comments are real-time (appear instantly for all users)
- [ ] File rows show comment count indicator
- [ ] Comments can be marked as resolved
- [ ] Activity feed shows all comments chronologically

## Dependencies

- None (can be built independently)

## Effort Estimation

- **Complexity**: Low-Medium
- **Estimated Time**: 3-4 days
- **Priority**: P1 (High) - Enables collaboration

## Future Enhancements

- @mentions with notifications
- Rich text formatting (markdown)
- File attachments in comments
- Comment search
- Threaded replies
- Email notifications for new comments
