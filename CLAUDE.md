# CLAUDE.md — Flowerapp

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**Flowerapp** is an AI-powered plant and flower identification web app. Users upload or capture a photo of any plant, and Claude's vision API identifies it — returning the common name, scientific name, care instructions, toxicity info, and fun facts.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Anthropic Claude API (vision)

## Repository Structure

```
Flowerapp/
├── CLAUDE.md                          # AI assistant guidance (this file)
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
├── postcss.config.mjs                 # PostCSS / Tailwind CSS config
├── .env.example                       # Environment variable template
├── .gitignore
├── public/                            # Static assets
└── src/
    ├── app/
    │   ├── layout.tsx                 # Root layout with metadata
    │   ├── page.tsx                   # Main page (client component, app shell)
    │   ├── globals.css                # Global styles + Tailwind import
    │   └── api/
    │       └── identify/
    │           └── route.ts           # POST /api/identify — Claude vision API
    ├── components/
    │   ├── ImageUploader.tsx           # Photo upload/capture with drag-and-drop
    │   ├── LoadingSpinner.tsx          # Animated loading state
    │   ├── PlantResult.tsx             # Plant identification result display
    │   └── HistoryPanel.tsx            # Recent identifications sidebar
    └── lib/
        └── types.ts                   # Shared TypeScript types
```

## Getting Started

1. Clone the repository
2. `npm install`
3. Copy `.env.example` to `.env` and add your Anthropic API key
4. `npm run dev` — starts the dev server at http://localhost:3000

## Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production server | `npm start` |
| Lint | `npm run lint` |

## Architecture

### Frontend (Client Components)
- **`page.tsx`** — Main app shell. Manages state for: current result, loading, errors, and identification history. Orchestrates the upload → identify → display flow.
- **`ImageUploader`** — Handles file selection (click), camera capture (mobile), and drag-and-drop. Converts images to base64 and passes them up.
- **`PlantResult`** — Renders the full identification card: hero image with overlay, confidence badge, care guide grid, fun facts, and toxicity warnings.
- **`HistoryPanel`** — Horizontal scrollable list of recent identifications (kept in React state, max 10 items).
- **`LoadingSpinner`** — Animated spinner shown during API calls.

### Backend (API Route)
- **`POST /api/identify`** — Accepts `{ image: string (base64), mediaType: string }`. Sends the image to Claude's vision API with a structured botanist prompt. Returns `{ plant: PlantIdentification }` as JSON.
- Uses `claude-sonnet-4-20250514` model for vision identification.
- The system prompt enforces strict JSON-only output matching the `PlantIdentification` type.

### Data Flow
```
User uploads photo
  → ImageUploader converts to base64
  → page.tsx calls POST /api/identify
  → API route sends image to Claude vision API
  → Claude returns structured JSON identification
  → PlantResult renders the result
  → Result added to history
```

### Key Types (`src/lib/types.ts`)
- **`PlantIdentification`** — The core data shape returned by the API: commonName, scientificName, family, confidence, description, careInfo, funFacts, isEdible, isToxic, toxicityNote.
- **`IdentificationResult`** — Wraps PlantIdentification with imageUrl and timestamp for history tracking.

## Environment & Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key from https://console.anthropic.com/ |

The API key is read automatically by the `@anthropic-ai/sdk` package from the environment.

## Development Workflow

### Branch Naming
- Feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Claude/AI branches: `claude/<description>-<session-id>`

### Commits
- Write clear, concise commit messages describing **why** the change was made
- Keep commits focused on a single logical change

### Code Style
- TypeScript strict mode is enabled
- Tailwind CSS v4 for all styling (no CSS modules or styled-components)
- All page/component files use `"use client"` directive (client-side rendering)
- API routes are server-side only (no `"use client"`)
- Prefer functional components with hooks

## Key Conventions for AI Assistants

1. **Read before writing** — Always read existing files before modifying them
2. **Minimal changes** — Only change what is necessary to accomplish the task
3. **No over-engineering** — Avoid adding abstractions, utilities, or features beyond what was requested
4. **Security first** — Never introduce command injection, XSS, SQL injection, or other vulnerabilities; never commit `.env` files
5. **Don't guess** — If context is missing, ask the user rather than making assumptions
6. **Test your work** — Run `npm run build` after making changes to verify compilation
7. **Keep this file updated** — When adding new tools, scripts, or conventions, update CLAUDE.md accordingly
8. **Respect the stack** — Use Tailwind for styling, App Router conventions for routing, and the Anthropic SDK for AI features
