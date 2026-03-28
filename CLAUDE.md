# CLAUDE.md — FPL War Room

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**FPL War Room** is a Fantasy Premier League dashboard app. It provides a dark-themed command-center interface for managing your FPL squad, analyzing transfers, tracking fixture difficulty, monitoring mini-league standings, and reviewing squad analytics.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4

## Repository Structure

```
Flowerapp/
├── CLAUDE.md                          # AI assistant guidance (this file)
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── next.config.ts                     # Next.js configuration
├── postcss.config.mjs                 # PostCSS / Tailwind CSS config
├── .gitignore
└── src/
    ├── app/
    │   ├── layout.tsx                 # Root layout (dark theme)
    │   ├── page.tsx                   # Main dashboard page with tab navigation
    │   └── globals.css                # Global styles + Tailwind import
    ├── components/
    │   ├── ManagerHeader.tsx           # Manager info bar, GW stats, chips, deadline
    │   ├── TabNav.tsx                  # Tab navigation (Squad, Transfers, Fixtures, League, Analytics)
    │   ├── SquadView.tsx               # Pitch-style squad view with player cards
    │   ├── TransfersView.tsx           # Transfer suggestions with in/out comparison
    │   ├── FixturesView.tsx            # Upcoming fixtures + FDR ticker grid
    │   ├── LeagueView.tsx              # Mini-league standings table
    │   └── AnalyticsView.tsx           # Squad analytics, leaderboards, position breakdown
    └── lib/
        ├── types.ts                   # Shared TypeScript types (Player, Fixture, etc.)
        └── mock-data.ts              # Mock data for all views
```

## Getting Started

1. Clone the repository
2. `npm install`
3. `npm run dev` — starts the dev server at http://localhost:3000

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
- **`page.tsx`** — Main dashboard shell. Manages active tab state and renders the appropriate view.
- **`ManagerHeader`** — Displays manager name, team name, GW/overall points and rank, bank balance, free transfers, chip availability, and deadline countdown.
- **`TabNav`** — Horizontal tab bar for switching between Squad, Transfers, Fixtures, League, and Analytics views.
- **`SquadView`** — Renders the starting XI on a pitch layout (GKP → DEF → MID → FWD rows) plus bench. Each player card shows position, name, team, GW points, price, and a hover tooltip with detailed stats.
- **`TransfersView`** — Shows transfer budget info and suggested transfers with side-by-side player comparison cards.
- **`FixturesView`** — Lists upcoming GW fixtures and a color-coded Fixture Difficulty Rating (FDR) ticker grid for key teams.
- **`LeagueView`** — Mini-league standings table with rank, team name, GW points, and total points. Highlights the user's team.
- **`AnalyticsView`** — Squad summary stats, leaderboards (by Form, xGI, ICT, Value), and position breakdown.

### Data
- Currently uses mock data (`src/lib/mock-data.ts`). Can be connected to the official FPL API in the future.

### Key Types (`src/lib/types.ts`)
- **`Player`** — Full player data: name, team, position, price, points, goals, assists, form, xG/xA/xGI, ICT, etc.
- **`Fixture`** — Match data with teams, scores, kickoff, FDR difficulty.
- **`TeamFixtures`** — A team's upcoming fixture schedule for the FDR ticker.
- **`GameweekStatus`** — Current GW info, deadline, average/highest scores.
- **`ManagerInfo`** — Manager profile: rank, points, bank, transfers, chips.
- **`TransferTarget`** — Transfer suggestion with in/out player comparison.
- **`LeagueStanding`** — Mini-league entry with rank and points.
- **`TabId`** — Union type for navigation tabs.

## Code Style

- TypeScript strict mode is enabled
- Tailwind CSS v4 for all styling (dark theme)
- All page/component files use `"use client"` directive (client-side rendering)
- Prefer functional components with hooks
- Dark color scheme: gray-950 background, emerald accents, gray-800 cards
