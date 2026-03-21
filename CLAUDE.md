# CLAUDE.md — Flowerapp

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**Flowerapp** is an AI-powered plant and flower identification web app. Users upload or capture a photo of any plant, and Claude's vision API identifies it — returning the common name, scientific name, care instructions, toxicity info, and fun facts.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Anthropic Claude API (vision) · Football CSV data (football-data.co.uk, GitHub, Kaggle)

## Football Analytics Module

The app includes a football analytics section focused on **player bookings** across Europe's top leagues. Features:

- **Dashboard** (`/football`) — Today's matches, recent results, quick stats
- **Standings** (`/football/standings`) — Live league tables for 9 European competitions
- **Fixtures & Results** (`/football/fixtures`) — Browse upcoming fixtures and recent results by league
- **Bookings Analytics** (`/football/bookings`) — The main focus:
  - Player booking frequency and card-per-match rates
  - Referee strictness ratings (Lenient → Very Strict) based on cards/match
  - Team discipline rankings with per-match card averages
  - Booking timing analysis (by half, by 15-minute windows)
  - Card timeline visualizations for individual players

**Data sources (CSV-based, no API key required):**
- [football-data.co.uk](https://www.football-data.co.uk) — Match result CSVs for all leagues (cards, fouls, referee, shots, corners)
- [GitHub football-datasets](https://github.com/datasets/football-datasets) — Premier League CSV (fallback)
- [Kaggle player stats](https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026) — Individual player card data (optional CSV upload)

**Leagues covered:** PL, Bundesliga, Serie A, La Liga, Ligue 1, Eredivisie, Primeira Liga, Championship

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
    │   ├── api/
    │   │   ├── identify/
    │   │   │   └── route.ts           # POST /api/identify — Claude vision API
    │   │   └── football/
    │   │       ├── standings/route.ts  # GET — league standings proxy
    │   │       ├── matches/route.ts   # GET — competition matches proxy
    │   │       ├── match/route.ts     # GET — single match detail proxy
    │   │       └── today/route.ts     # GET — today's matches proxy
    │   └── football/
    │       ├── layout.tsx             # Football section layout (dark theme)
    │       ├── page.tsx               # Dashboard — today's matches, quick stats
    │       ├── standings/page.tsx     # League standings tables
    │       ├── fixtures/page.tsx      # Fixtures & results browser
    │       └── bookings/page.tsx      # Booking analytics dashboard
    ├── components/
    │   ├── ImageUploader.tsx           # Photo upload/capture with drag-and-drop
    │   ├── LoadingSpinner.tsx          # Animated loading state
    │   ├── PlantResult.tsx             # Plant identification result display
    │   ├── HistoryPanel.tsx            # Recent identifications sidebar
    │   └── football/
    │       ├── FootballNav.tsx         # Football section navigation bar
    │       ├── LeagueSelector.tsx      # Competition picker (9 leagues)
    │       ├── MatchCard.tsx           # Match result/fixture card
    │       ├── StatCard.tsx            # Metric stat card with gradient
    │       ├── BarChart.tsx            # Vertical bar chart (CSS-based)
    │       ├── HorizontalBar.tsx       # Horizontal bar chart component
    │       └── LoadingSkeleton.tsx     # Animated loading placeholder
    └── lib/
        ├── types.ts                   # Plant identification types
        ├── football-types.ts          # Football API + analytics types
        ├── football-api.ts            # Football-Data.org API client with caching
        └── booking-analytics.ts       # Booking analytics engine
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

The Anthropic API key is read automatically by the `@anthropic-ai/sdk` package. The football analytics module uses CSV data fetched from public URLs — no API key needed.

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
