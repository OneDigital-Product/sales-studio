# Sales Studio - PEO/ACA Quote Management Platform

Sales Studio is a modern web application for managing clients and census data for PEO and ACA health plan quoting. It combines intelligent file detection with a streamlined data management interface.

## 🎯 Project Status

This project is being developed through autonomous AI agent sessions. Each agent works toward completing features defined in `feature_list.json`.

**Current Progress:** See `feature_list.json` for detailed test case status (200+ features tracked)

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
# Quick start with initialization script
./init.sh

# Or manually:
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

## 🧪 Testing

Test cases are defined in `feature_list.json` (200+ features). Each feature has:
- **category:** "functional" or "style"
- **description:** What the test verifies
- **steps:** Detailed testing steps
- **passes:** Boolean status (false = not implemented, true = passing)

To test a feature:
1. Follow the steps in `feature_list.json`
2. Verify expected behavior
3. Update `passes` to `true` if feature works correctly
4. Commit the updated `feature_list.json`

## 🤖 For AI Agents

If you're an AI agent continuing this work:

1. **Read `feature_list.json`** to understand what needs to be built (200+ features)
2. **Read `CLAUDE.md`** for project-specific coding standards
3. **Run `./init.sh`** to start the development environment
4. **Work on features in priority order** (top to bottom in feature_list.json)
5. **Test thoroughly** before marking `passes: true`
6. **Commit progress regularly** with descriptive messages
7. **Leave a summary** in `claude-progress.txt` before your session ends

**CRITICAL:** Never remove or edit features in `feature_list.json`. Only change `passes: false` to `passes: true`.

## Contributing

1. Follow standards in CLAUDE.md
2. Run `bun format` before committing
3. Ensure `bun lint` and `bun check` pass
4. Keep commits atomic and descriptive

## License

Private
