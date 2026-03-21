# CLAUDE.md — Football Analytics

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**Football Analytics** is a web app focused on **player bookings** across Europe's top football leagues. It analyzes referee strictness, team discipline, card distributions, and match-level booking data — all powered by publicly available CSV data (no API keys required).

**Tech stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4

## Features

- **Dashboard** (`/football`) — Latest results, upcoming fixtures, quick stats
- **Standings** (`/football/standings`) — League tables computed from match results for 8 European leagues
- **Fixtures & Results** (`/football/fixtures`) — Browse results and upcoming games by league
- **Bookings Analytics** (`/football/bookings`) — The main focus:
  - Referee strictness ratings (Lenient → Very Strict) with home/away card bias
  - Team discipline rankings with cards/match, fouls/match, fouls-per-card ratios
  - Card distribution analysis (by match result, monthly trends, home vs away)
  - High-card match rankings
  - Player card profiles (via CSV upload from Kaggle/FBref)

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
├── netlify.toml                       # Netlify deployment config
├── postcss.config.mjs                 # PostCSS / Tailwind CSS config
├── .gitignore
├── public/                            # Static assets
└── src/
    ├── app/
    │   ├── layout.tsx                 # Root layout with metadata
    │   ├── page.tsx                   # Redirects to /football
    │   ├── globals.css                # Global styles + Tailwind import
    │   ├── api/football/
    │   │   ├── bookings/route.ts      # GET — booking analytics
    │   │   ├── fixtures/route.ts      # GET — upcoming fixtures
    │   │   ├── matches/route.ts       # GET — match results from CSV
    │   │   ├── match/route.ts         # GET — single match lookup
    │   │   ├── players/route.ts       # GET/POST — player stats CSV upload
    │   │   ├── standings/route.ts     # GET — computed league standings
    │   │   └── today/route.ts         # GET — today's matches
    │   └── football/
    │       ├── layout.tsx             # Football section layout (dark theme)
    │       ├── page.tsx               # Dashboard — results, fixtures, stats
    │       ├── standings/page.tsx     # League standings tables
    │       ├── fixtures/page.tsx      # Fixtures & results browser
    │       └── bookings/page.tsx      # Booking analytics dashboard (5 tabs)
    ├── components/football/
    │   ├── FootballNav.tsx            # Navigation bar
    │   ├── LeagueSelector.tsx         # League picker (8 leagues)
    │   ├── MatchCard.tsx              # Match result/fixture card
    │   ├── StatCard.tsx               # Metric stat card with gradient
    │   ├── BarChart.tsx               # Vertical bar chart (CSS-based)
    │   ├── HorizontalBar.tsx          # Horizontal bar chart component
    │   └── LoadingSkeleton.tsx        # Animated loading placeholder
    └── lib/
        ├── football-types.ts          # All TypeScript types and league definitions
        ├── football-api.ts            # CSV fetcher, parser, caching, standings computation
        └── booking-analytics.ts       # Booking analytics engine
```

## Getting Started

1. Clone the repository
2. `npm install`
3. `npm run dev` — starts the dev server at http://localhost:3000

No API keys or environment variables required. All data is fetched from public CSV sources.

## Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production server | `npm start` |
| Lint | `npm run lint` |

## Architecture

### Data Flow
```
football-data.co.uk CSV files
  → Server-side fetch with 30-min cache
  → CSV parser → MatchData[]
  → Analytics engine computes referee/team/card stats
  → API routes serve JSON to client
  → React components render dashboards
```

### Key Libraries
- `football-api.ts` — Fetches CSVs from public URLs, parses them, caches results in-memory (30 min TTL), and computes league standings from match results
- `booking-analytics.ts` — Processes match data to build referee strictness profiles, team discipline rankings, card distributions, monthly trends, and match result correlations
- `football-types.ts` — All TypeScript types: `MatchData`, `RefereeStats`, `TeamDiscipline`, `BookingAnalytics`, `PlayerStats`, `ComputedStanding`, etc.

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
8. **Respect the stack** — Use Tailwind for styling, App Router conventions for routing
