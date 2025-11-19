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

**Sales Studio** is a client and file management application for PEO/ACA quoting. It combines Next.js 16 (App Router) frontend with Convex backend, Shadcn UI components, and Tailwind CSS v4 styling.

**Package manager**: Bun (do not use npm or yarn)

## Architecture

### Frontend (Next.js App Router)

- **Root layout** (`app/layout.tsx`): Wraps with Convex client provider
- **Main page** (`app/page.tsx`): Client management dashboard with add/view clients
- **Client detail page** (`app/clients/[id]/page.tsx`): File upload, management, and census data viewing
- **UI components** (`components/`): Shadcn UI-based buttons, cards, dialogs, tables, etc.
- **Styling**: Tailwind CSS v4 (configured in `tailwind.config.js`)

**Key patterns**:
- Use `'use client'` only when client interactivity needed (state, hooks, browser APIs)
- Prefer Server Components for data fetching
- Query Convex via `useQuery()` and mutate via `useMutation()` from `convex/react`
- File uploads use Convex storage: generate upload URL → upload file → save metadata

### Backend (Convex)

**Database schema** (`convex/schema.ts`):
- `clients`: name, contactEmail, notes
- `files`: storageId, clientId, name, type ("PEO"/"ACA"/"Other"), uploadedAt with `by_clientId` index
- `census_uploads`: clientId, fileName, uploadedAt, columns, rowCount with `by_clientId` index
- `census_rows`: censusUploadId, data (flexible JSON), rowIndex with `by_censusUploadId` index

**Functions**:
- `clients.ts`: `createClient` (mutation), `getClients` (query), `getClient` (query)
- `files.ts`: `generateUploadUrl` (mutation), `saveFile` (mutation), `getFiles` (query with index), `deleteFile` (mutation + storage cleanup)
- `census.ts`: `saveCensus` (mutation, batch inserts rows), `getCensus` (query with pagination), `getLatestCensus` (query, orders desc)

**Patterns**:
- Use new function syntax with `args` validator and `handler`
- Always include return validators (use `v.null()` for void functions)
- Index queries with `.withIndex()` instead of `.filter()` for performance
- Use `.paginate()` for large result sets (e.g., census rows)

## Key Features & Implementation Notes

### File Upload Flow
1. User selects file(s) in client detail page
2. `isCensusFile()` heuristic checks extension + header keywords (DOB, gender, salary, zip, plan, tier, coverage)
3. Get signed upload URL from Convex storage
4. Upload file via HTTP POST
5. Save metadata record in `files` table
6. If detected as census, show `CensusImport` component for parsing/import

### Census Data Management
- CSV/XLSX files parsed on client with `xlsx` library (see app/clients/[id]/page.tsx:43-88)
- Imported census data stored in `census_uploads` + `census_rows` tables
- `CensusViewer` component fetches rows with pagination
- Latest census displayed in right panel; can be replaced by uploading new file

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
  layout.tsx           # Root layout with Convex provider
  page.tsx             # Dashboard (list clients)
  clients/
    [id]/page.tsx      # Client detail (files + census)
  ConvexClientProvider.tsx

components/
  ui/                  # Shadcn UI components (button, card, dialog, table, etc.)
  census/              # CensusImport, CensusViewer

convex/
  schema.ts            # Database schema
  clients.ts           # Client queries/mutations
  files.ts             # File queries/mutations
  census.ts            # Census queries/mutations

lib/
  utils.ts             # Utility functions

.cursor/rules/         # Coding standards (next.js, convex, neverthrow, ultracite)
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

## Known Limitations & TODOs

- Census row insertion uses `Promise.all()` for batch insert; consider background jobs for >10k rows
- External links (PEO Quoting, Perfect Quote) are currently disabled buttons
- No toast notifications yet (currently uses console.log for errors)
- File type detection is heuristic-based on column keywords; may need refinement for edge cases
