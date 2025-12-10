# CLAUDE.md

Guidance for Claude AI instances working on this Sales Studio repository. Follow these standards for consistency, quality, and maintainability.

## Commands

- **Dev**: `bun run dev:all` — Runs Next.js frontend + Convex backend concurrently
- **Frontend only**: `bun run dev` — Just the Next.js dev server
- **Backend only**: `bun run convex` — Just Convex dev environment
- **Check types**: `bun check` — TypeScript type checking with tsc
- **Lint**: `bun lint` — Run Biome linter
- **Format**: `bun format` — Auto-format code with Biome
- **Build**: `bun run build` — Build Next.js for production
- **Start**: `bun run start` — Run production build

## Project Overview

**Sales Studio** is a comprehensive client and census data management platform for PEO/ACA health plan quoting. It provides sophisticated quote pipeline management, census data validation, document organization, and team collaboration features.

**Package manager**: Bun (do not use npm or yarn)

**Documentation**:
- `USER_GUIDE.md` - Complete user guide for all features and workflows
- `.docs/` - Development/testing archive (session summaries, test scripts, etc.)

## Architecture

### Frontend (Next.js App Router)

- **Root layout** (`app/layout.tsx`): Wraps with Convex client provider
- **Main page** (`app/page.tsx`): Dashboard with client list, search, sort, bookmarking
- **Client detail page** (`app/clients/[id]/page.tsx`): Quote pipeline, file upload/management, census data validation and viewing, team comments
- **Archived page** (`app/archived/page.tsx`): View archived/deleted clients
- **Statistics pages** (`app/statistics/page.tsx`, `app/stats/page.tsx`): Analytics and reporting
- **UI components** (`components/`): Shadcn UI-based buttons, cards, dialogs, tables, etc.
- **Styling**: Tailwind CSS v4 (configured in `tailwind.config.ts`)

**Key patterns**:
- Use `'use client'` only when client interactivity needed (state, hooks, browser APIs)
- Prefer Server Components for data fetching
- Query Convex via `useQuery()` and mutate via `useMutation()` from `convex/react`
- File uploads use Convex storage: generate upload URL → upload file → save metadata

### Backend (Convex)

**Database schema** (`convex/schema.ts`):
- `clients`: name, contactEmail, notes, isArchived, bookmarked
- `files`: storageId, clientId, name, type (category), teamRelevance (PEO/ACA/Both), isRequired, isVerified, uploadedAt, uploader, verifier with `by_clientId` index
- `census_uploads`: clientId, fileName, uploadedAt, columns, rowCount, peoQualityScore, acaQualityScore with `by_clientId` index
- `census_rows`: censusUploadId, data (flexible JSON), rowIndex, validationStatus with `by_censusUploadId` index
- `quotes`: clientId, type (PEO/ACA), status (7-stage pipeline), isBlocked, blockReason, assignedAnalyst, startedAt, completedAt, notes, with history
- `comments`: clientId, author, team (PEO/ACA/Sales), content, timestamp, isResolved with `by_clientId` index
- `information_requests`: clientId, quoteTypes, status, items (list), requestedBy, requestedAt, notes

**Functions**:
- `clients.ts`: `createClient`, `getClients`, `getClient`, `updateClient`, `archiveClient`, `deleteClient`, `toggleBookmark`
- `files.ts`: `generateUploadUrl`, `saveFile`, `getFiles`, `deleteFile`, `verifyFile`, `updateFileMetadata`
- `census.ts`: `saveCensus`, `getCensus` (paginated), `getLatestCensus`, `cloneCensus`, `validateCensusData`
- `quotes.ts`: `createQuote`, `getQuotes`, `updateQuoteStatus`, `blockQuote`, `addStatusNote`, `getQuoteHistory`
- `comments.ts`: `addComment`, `getComments`, `markCommentResolved`, `deleteComment`
- `requests.ts`: `createRequest`, `getRequests`, `updateRequestStatus`, `addRequestItem`, `markItemReceived`

**Patterns**:
- Use new function syntax with `args` validator and `handler`
- Always include return validators (use `v.null()` for void functions)
- Index queries with `.withIndex()` instead of `.filter()` for performance
- Use `.paginate()` for large result sets (e.g., census rows)

## Key Features & Implementation Notes

### Quote Pipeline Management
- 7-stage pipeline: Not Started → Intake → Underwriting → Proposal Ready → Presented → Accepted/Declined
- Block quotes with custom reasons
- Assign quotes to analysts
- Full audit trail of status changes with timestamps and notes
- Separate PEO and ACA quote tracking

### File Upload Flow
1. User selects file(s) in client detail page via drag-drop or browse
2. `isCensusFile()` heuristic checks extension + header keywords (DOB, gender, salary, zip, plan, tier, coverage)
3. Get signed upload URL from Convex storage
4. Upload file via HTTP POST
5. Save metadata record in `files` table with team relevance and required flags
6. If detected as census, show `CensusImport` component for parsing/import

### Census Data Management & Validation
- CSV/XLSX files parsed on client with `xlsx` library
- Dual validation: PEO (Name, DOB, Zip, Salary, Coverage Tier) and ACA (PEO + Hire Date, Hours/Week)
- Quality scoring (0-100%) for both PEO and ACA requirements
- Row-level validation status (green=valid, yellow=issues)
- Cell-level highlighting (red=missing, yellow=invalid)
- Interactive census viewer with filtering and pagination
- Version history with comparison mode
- Census cloning between clients
- Quality trend tracking over multiple versions

### Team Collaboration
- Internal comments by team (PEO, ACA, Sales)
- Comment status tracking (resolved/unresolved)
- Information requests with pre-populated validation issues
- File verification with verifier name tracking
- Team-specific file relevance (PEO, ACA, or Both)
- Activity feed showing recent changes

## Code Standards & Constraints

**From `.cursor/rules/global.mdc`**:
- Always use TypeScript
- Do NOT write explicit return types for functions (unless necessary)
- Do NOT add unit tests unless explicitly asked
- Use `neverthrow` library for error handling (Result/ResultAsync types)
- Be extremely concise; sacrifice grammar for brevity

**From `.cursor/rules/nextjs.mdc`**:
- Prefer Server Components; add `'use client'` only for interactivity
- Fetch data in Server Components; use `use()` hook in Client Components for promises
- Use Server Actions (`'use server'`) for mutations; revalidate cache with `revalidatePath`/`revalidateTag`
- Use `next/image` for images, `next/font` for fonts
- Use Lucide icons via `lucide-react` import

**From `.cursor/rules/convex.mdc`**:
- Always use new function syntax (`query({args, handler})`, not default export)
- Always include argument AND return validators
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Query via indexes, not `.filter()`
- Use `.unique()` for single-document queries
- Use `.order('asc'/'desc')` to control ordering
- Do NOT use `ctx.db` in actions

**From `.cursor/rules/ultracite.mdc` (Biome rules)**:
- Remove `console.log`, `debugger`, `alert` from production
- Throw Error objects with messages, not strings
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Semantic HTML with proper ARIA (labels, alt text, heading hierarchy)
- Add `rel="noopener"` for `target="_blank"` links
- Avoid barrel files; use specific imports

**Biome preset**: `ultracite/core` + `ultracite/next`
- Run `bun format` to auto-fix most issues
- Configured to ignore `convex/_generated` (generated code)

## Environment & Config

- **Node target**: ES2017
- **TypeScript**: strict mode enabled
- **Path aliases**: `@/*` maps to root (e.g., `@/components`, `@/lib`)
- **Convex**: Requires `NEXT_PUBLIC_CONVEX_URL` environment variable

## Common Patterns

### Add a New Client
```tsx
const createClient = useMutation(api.clients.createClient);
await createClient({ name, contactEmail, notes });
```

### Fetch Files for a Client
```tsx
const files = useQuery(api.files.getFiles, { clientId });
// Result includes pre-signed URLs for download
```

### Upload File
```tsx
const url = await generateUploadUrl(); // Get signed upload URL
const res = await fetch(url, { method: 'POST', body: file });
const { storageId } = await res.json();
await saveFile({ storageId, clientId, name, type });
```

### Fetch Paginated Census Rows
```tsx
const result = useQuery(api.census.getCensus, {
  censusUploadId,
  paginationOpts: { numItems: 50, cursor: null }
});
// result.rows = { page, isDone, continueCursor }
```

## File Organization

```
app/
  layout.tsx                        # Root layout with Convex provider
  page.tsx                          # Dashboard (client list, search, sort, bookmarking)
  clients/
    [id]/page.tsx                   # Client detail (quotes, files, census, comments)
  archived/page.tsx                 # Archived clients view
  statistics/page.tsx               # Analytics dashboard
  stats/page.tsx                    # Reporting page
  convex-client-provider.tsx        # Convex React context provider

components/
  ui/                               # Shadcn UI components (button, card, dialog, table, etc.)
  census/                           # CensusImport, CensusViewer, validation components
  quotes/                           # Quote status components, pipeline UI
  files/                            # File upload, file list, verification
  comments/                         # Comment section, activity feed
  requests/                         # Information request forms and tracking

convex/
  schema.ts                         # Database schema (clients, files, census, quotes, comments, requests)
  clients.ts                        # Client operations
  files.ts                          # File upload/management
  census.ts                         # Census data processing/validation
  quotes.ts                         # Quote pipeline management
  comments.ts                       # Comment/activity operations
  requests.ts                       # Information request operations

lib/
  utils.ts                          # Utility functions
  validators.ts                     # Census validation logic

.docs/                              # Development archive (tests, session summaries, notes)

.cursor/rules/                      # Coding standards (next.js, convex, neverthrow, ultracite)
```

## Best Practices for This Project

### TypeScript & Type Safety
- Use `strict: true` mode (enabled in tsconfig.json)
- Avoid explicit return types unless needed (let inference work)
- Use `Record<string, unknown>` instead of `any` for flexible objects
- Leverage type narrowing over assertions

### React & Components
- Prefer Server Components in Next.js; use `'use client'` only when necessary
- Use Shadcn components for UI consistency
- Extract complex logic into helper functions
- Use semantic HTML with ARIA attributes for accessibility

### Error Handling
- Use `neverthrow` Result/ResultAsync for operations that may fail
- Avoid throwing errors; return results instead
- Use `.match()` to handle success/error at boundaries
- Never use `any` for error types

### Code Organization
- Keep functions under 50 lines where practical
- Extract complex conditions into named variables
- Use early returns to minimize nesting
- Group related code; separate concerns

### Performance
- Use named imports (not namespace imports)
- Avoid spread operators in loops
- Prefer Convex indexes for queries (don't use `.filter()`)
- Paginate large result sets (use `.paginate()`)

## Documentation & Resources

- `USER_GUIDE.md` - Complete user-facing guide covering all features and workflows
- `.docs/README.md` - Overview of testing/development archive
- `AGENTS.md` - Project rules and standards for Claude AI agents
- `README.md` - Project overview and quick start

## Known Limitations & Future Enhancements

- Census row insertion uses `Promise.all()` for batch insert; consider background jobs for >10k rows
- File type detection is heuristic-based on column keywords; may need refinement for edge cases
- Mobile responsiveness for complex census viewer may need enhancement
- Real-time collaboration features (live co-editing) not yet implemented
- Export functionality (CSV, Excel) for reports not yet implemented
- Integration with external PEO/ACA quoting systems pending
