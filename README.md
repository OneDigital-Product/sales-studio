# Sales Studio

Sales Studio is a modern web application for managing clients and census data for PEO and ACA health plan quoting. It combines intelligent file detection with a streamlined data management interface.

## Features

- **Client Management**: Create, view, and manage client profiles with contact information and notes
- **Smart File Upload**: Automatic detection of census data vs. general quote data with multi-file support
- **Census Data Parsing**: Intelligent parsing of Excel/CSV files with column detection and preview
- **File Management**: Download, organize, and delete uploaded files with metadata tracking
- **Responsive UI**: Mobile-first design with Shadcn UI components and Tailwind CSS v4
- **Real-time Database**: Convex backend with instant sync and zero-latency updates

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router) with React 19
- **Backend & Database**: [Convex](https://convex.dev) - backend as a service with real-time sync
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) - utility-first CSS with CSS variables
- **UI Components**: [Shadcn UI](https://ui.shadcn.com) - composable React components
- **Package Manager**: [Bun](https://bun.sh) - fast all-in-one JavaScript runtime
- **Error Handling**: [neverthrow](https://github.com/supermacro/neverthrow) - type-safe error handling
- **Code Quality**: [Biome](https://biomejs.dev) with Ultracite preset for linting and formatting
- **File Processing**: [XLSX](https://sheetjs.com) for Excel/CSV parsing

## Quick Start

### Prerequisites
- Node.js 18+ (Bun handles this automatically)
- Bun installed globally (`curl -fsSL https://bun.sh/install | bash`)

### Installation & Development

```bash
# Install dependencies
bun install

# Run dev server (Next.js + Convex)
bun run dev:all

# Frontend only
bun run dev

# Backend only
bun run convex

# Type checking
bun check

# Code linting
bun lint

# Format code
bun format

# Production build
bun run build

# Start production server
bun run start
```

Visit [http://localhost:3000](http://localhost:3000) after running `bun run dev:all`.

## Architecture

### Frontend (Next.js App Router)
- **Server Components** by default for data fetching
- **Client Components** (`'use client'`) only where interactivity needed
- **File Organization**: `app/` for routes, `components/` for UI
- **Data**: Convex queries/mutations via `convex/react` hooks

### Backend (Convex)
- **Real-time Database**: `clients`, `files`, `census_uploads`, `census_rows` tables
- **Functions**: Query/mutation functions with typed validators
- **Storage**: Built-in file storage for document uploads
- **Indexing**: Optimized queries with indexes on foreign keys

### UI & Styling
- Tailwind CSS v4 with CSS variable theming
- Shadcn UI for consistent, accessible components
- Mobile-first responsive design

## Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed architecture, common patterns, and implementation notes.

### Code Standards

- **Language**: TypeScript (strict mode)
- **Format**: `bun format` (Biome with Ultracite)
- **Lint**: `bun lint` (Biome linter)
- **Type Check**: `bun check` (TypeScript)
- **Framework**: Next.js App Router, Server Components first
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI + custom components
- **Error Handling**: neverthrow for functional error handling
- **Testing**: Jest/Vitest (not included by default; add if needed)

## Project Structure

```
app/
  layout.tsx           # Root layout with Convex provider
  page.tsx             # Dashboard (client list)
  clients/[id]/        # Client detail page
  convex-client-provider.tsx

components/
  ui/                  # Shadcn UI components (dialog, button, table, etc.)
  census/              # Census import & viewer components

convex/
  schema.ts            # Database schema
  clients.ts           # Client queries/mutations
  files.ts             # File upload/download queries/mutations
  census.ts            # Census data queries/mutations

lib/
  utils.ts             # Utility functions

.cursor/rules/         # Coding standards for Cursor AI
.github/               # GitHub workflows and instructions
```

## Key Implementation Details

### Census Data Detection
- Heuristic-based detection using column header keywords
- Keywords: DOB, gender, salary, zip, plan, tier, coverage
- Requires 2+ matching keywords to classify as census data

### File Upload Flow
1. Generate signed upload URL from Convex
2. Upload file to Convex storage
3. Save metadata in `files` table
4. For census files, trigger import dialog with preview

### Database Schema Highlights
- `clients`: name, contactEmail, notes
- `files`: storageId, clientId, name, type, uploadedAt (with index by clientId)
- `census_uploads`: metadata for parsed census files
- `census_rows`: individual row data (supports large uploads with pagination)

## Environment Variables

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Set in `.env.local` for local development.

## Contributing

1. Follow standards in CLAUDE.md
2. Run `bun format` before committing
3. Ensure `bun lint` and `bun check` pass
4. Keep commits atomic and descriptive

## License

Private
