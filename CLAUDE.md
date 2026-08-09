# CLAUDE.md — Flowerapp

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**Flowerapp** hosts two independent apps in one Next.js project:

1. **Plant & flower identifier (`/`)** — users upload or capture a photo of any plant, and Claude's vision API identifies it, returning the common name, scientific name, care instructions, toxicity info, and fun facts.
2. **Weather dashboard (`/weather`)** — a personal weather app on the Vaisala Xweather API: current conditions, a minute-by-minute precipitation nowcast, 48-hour and 10-day forecasts, the trailing 24 hours, a historical archive explorer, air quality, sun/moon data, alerts and radar maps.

The two apps share nothing but the Next.js shell. The weather app's styling is scoped to a `.wx` wrapper so it doesn't inherit the plant app's light green palette.

**Tech stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Anthropic Claude API (vision) · Vaisala Xweather API

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
    │   ├── page.tsx                   # Plant identifier (client component)
    │   ├── globals.css                # Global styles + Tailwind import
    │   ├── weather/
    │   │   ├── layout.tsx             # Weather metadata + .wx theme wrapper
    │   │   ├── page.tsx               # Weather dashboard shell (tabs, state)
    │   │   └── weather.css            # Scoped dark theme for the weather app
    │   └── api/
    │       ├── identify/
    │       │   └── route.ts           # POST /api/identify — Claude vision API
    │       └── weather/
    │           ├── overview/route.ts   # Everything for the dashboard, one call
    │           ├── history/route.ts    # Daily summaries + normals for a range
    │           ├── archive/route.ts    # One past day, hour by hour
    │           ├── search/route.ts     # Place autocomplete
    │           ├── map/route.ts        # Raster map proxy (keeps the key server-side)
    │           └── diagnostics/route.ts # Which Xweather endpoints your key unlocks
    ├── components/
    │   ├── ImageUploader.tsx           # Photo upload/capture with drag-and-drop
    │   ├── LoadingSpinner.tsx          # Animated loading state
    │   ├── PlantResult.tsx             # Plant identification result display
    │   ├── HistoryPanel.tsx            # Recent identifications sidebar
    │   └── weather/
    │       ├── ui.tsx                  # Card, Metric, Chip, Meter, SectionBody…
    │       ├── Chart.tsx               # Dependency-free SVG line/area/bar chart
    │       ├── LocationBar.tsx         # Search, geolocation, favourites, units
    │       ├── NowPanel.tsx            # Current conditions, alerts, nowcast
    │       ├── HourlyPanel.tsx         # 48-hour forecast
    │       ├── ForecastPanel.tsx       # 10-day + day/night forecast
    │       ├── RecentPanel.tsx         # Trailing 24 hours
    │       ├── WeatherHistoryPanel.tsx # Archive explorer
    │       ├── AirSunPanel.tsx         # Air quality + sun/moon
    │       └── MapPanel.tsx            # Raster map with layer picker
    └── lib/
        ├── types.ts                   # Plant identification types
        ├── weather-types.ts           # Xweather response types
        ├── xweather.ts                # SERVER-ONLY Xweather API client
        └── weather-format.ts          # Client-safe formatting helpers
```

## Getting Started

1. Clone the repository
2. `npm install`
3. Copy `.env.example` to `.env` and fill in the keys you need — `ANTHROPIC_API_KEY`
   for the plant identifier, `XWEATHER_CLIENT_ID` / `XWEATHER_CLIENT_SECRET` for
   the weather dashboard
4. `npm run dev` — starts the dev server at http://localhost:3000
   (plant identifier at `/`, weather dashboard at `/weather`)

## Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production server | `npm start` |
| Lint | `npm run lint` |

## Architecture

### Plant identifier (`/`)

#### Frontend (Client Components)
- **`page.tsx`** — Main app shell. Manages state for: current result, loading, errors, and identification history. Orchestrates the upload → identify → display flow.
- **`ImageUploader`** — Handles file selection (click), camera capture (mobile), and drag-and-drop. Converts images to base64 and passes them up.
- **`PlantResult`** — Renders the full identification card: hero image with overlay, confidence badge, care guide grid, fun facts, and toxicity warnings.
- **`HistoryPanel`** — Horizontal scrollable list of recent identifications (kept in React state, max 10 items).
- **`LoadingSpinner`** — Animated spinner shown during API calls.

#### Backend (API Route)
- **`POST /api/identify`** — Accepts `{ image: string (base64), mediaType: string }`. Sends the image to Claude's vision API with a structured botanist prompt. Returns `{ plant: PlantIdentification }` as JSON.
- Uses `claude-sonnet-4-20250514` model for vision identification.
- The system prompt enforces strict JSON-only output matching the `PlantIdentification` type.

#### Data Flow
```
User uploads photo
  → ImageUploader converts to base64
  → page.tsx calls POST /api/identify
  → API route sends image to Claude vision API
  → Claude returns structured JSON identification
  → PlantResult renders the result
  → Result added to history
```

#### Key Types (`src/lib/types.ts`)
- **`PlantIdentification`** — The core data shape returned by the API: commonName, scientificName, family, confidence, description, careInfo, funFacts, isEdible, isToxic, toxicityNote.
- **`IdentificationResult`** — Wraps PlantIdentification with imageUrl and timestamp for history tracking.

### Weather dashboard (`/weather`)

#### Frontend
- **`weather/page.tsx`** — App shell. Owns the selected place, unit system,
  12/24-hour clock, saved places (localStorage) and the active tab. Fetches
  `/api/weather/overview` once per location and hands the payload to each panel.
- **Panels** — `NowPanel`, `HourlyPanel`, `ForecastPanel`, `RecentPanel`,
  `AirSunPanel` and `MapPanel` read from the overview payload.
  `WeatherHistoryPanel` fetches on its own because the date range is user-driven.
- **`Chart.tsx`** — All charts are inline SVG (lines, filled areas, an optional
  bar series on its own scale, native `<title>` tooltips). No charting library.

#### Backend (API Routes)
- **`GET /api/weather/overview?p=`** — Resolves the place, then fans out to 14
  Xweather data sets in parallel and returns them as `Section<T>` values.
- **`GET /api/weather/history?p=&from=&to=`** — Daily summaries, station
  summaries and climate normals for a range (capped at ~1 month upstream).
- **`GET /api/weather/archive?p=&date=`** — One past day, hour by hour.
- **`GET /api/weather/search?q=`** — Place autocomplete.
- **`GET /api/weather/map?lat=&lon=&zoom=&layers=&offset=`** — Raster map proxy.
- **`GET /api/weather/diagnostics?p=`** — Per-endpoint availability report.

#### Data Flow
```
User picks a place (search / geolocation / saved chip)
  → page.tsx calls GET /api/weather/overview?p=…
  → route resolves the place, then fans out to Xweather in parallel
  → each data set is wrapped in a Section (ok | error + code)
  → panels render, showing an inline notice for any unavailable section
```

## Environment & Configuration

| Variable | Required for | Description |
|----------|--------------|-------------|
| `ANTHROPIC_API_KEY` | `/` (plant identifier) | Your Anthropic API key from https://console.anthropic.com/ |
| `XWEATHER_CLIENT_ID` | `/weather` | Xweather application ID from https://account.xweather.com/ |
| `XWEATHER_CLIENT_SECRET` | `/weather` | Xweather application secret |
| `METOFFICE_API_KEY` | `/weather` (optional) | Met Office DataHub site-specific, for the Second opinion card |
| `METOFFICE_MAP_API_KEY` | `/weather` (optional) | DataHub map images — separate subscription, 1000 images/day |
| `METOFFICE_OBS_API_KEY` | `/weather` (optional) | DataHub land observations — separate subscription, 360 calls/day |
| `METOFFICE_ATMO_API_KEY` | `/weather` (optional) | DataHub atmospheric models — read the note below before using |

`ANTHROPIC_API_KEY` is read automatically by the `@anthropic-ai/sdk` package. The
Xweather pair is read only by `src/lib/xweather.ts`, which runs server-side; the
credentials never reach the browser (raster map tiles are proxied through
`/api/weather/map` for the same reason).

Either app runs fine without the other's keys — a missing key produces an inline
notice rather than a crash.

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

## Xweather Notes

- Base URL `https://data.api.xweather.com/{endpoint}/{action}`, auth via
  `client_id` / `client_secret` query params, envelope
  `{ success, error: { code, description }, response }`.
- Endpoints used: `places`, `places/search`, `conditions` (current, `filter=1min`
  nowcast, trailing window, and `conditions/summary` for daily history),
  `observations` (+ `/summary`, `/archive`), `forecasts` (`1hr`, `mdnt2mdnt`,
  `daynight`), `alerts`, `airquality` (+ `/forecasts`), `sunmoon`, `threats`,
  `lightning/summary`, `phrases/summary`, `normals`.
- Raster maps come from `https://maps.api.xweather.com/{id}_{secret}/{layers}/{w}x{h}/{lat},{lon},{zoom}/{offset}.png`.
  `/api/weather/map` validates the layer list against an allow-list before
  building that URL.
- **Never invent a raster layer token.** They live in `src/lib/map-layers.ts`,
  which both the proxy route and `MapPanel` import so the two cannot drift.
  A rejected token fails the *whole* image rather than just its own layer, so
  one wrong guess takes the map down under every setting. Several obvious
  guesses are wrong: it is `satellite-geocolor` not `satellite`,
  `countries-outlines` not `countries`, `fires-obs-points` not `fires`,
  `lightning-all` not `lightning-strikes-5m-icons`, and
  `air-quality-index-categories` not `air-quality-index`. To add a layer, get
  the real token from the Vaisala Xweather MCP server's `xweather_get_raster_maps`
  tool — it returns a fully built map URL, and the tokens can be read straight
  out of the path.
- `GET /api/weather/diagnostics?p=<place>` calls every endpoint above and reports
  which ones your key can actually reach — start there when a card is empty.
- Responses carry both metric and imperial fields (`tempC`/`tempF`,
  `windSpeedKPH`/`windSpeedMPH`, …), so the unit toggle needs no extra requests.

## Met Office comparison

A second forecast beside Xweather rather than instead of it — the DataHub has no
nowcast, no radar rasters and no archive, which is most of what this app does.

- **The free plan is 360 calls a day**, reset at 00:00 UTC. `getMetOfficeHourly`
  caches for 30 minutes, so one location costs about 48. Raising that cache is
  the first thing to check if a `rate_limited` section appears.
- Values arrive in SI and are converted in `lib/metoffice.ts`: m/s to km/h,
  pascals to millibars, metres to kilometres. Do not pass raw Met Office numbers
  to the formatters.
- `compareForecasts` in `weather-format.ts` matches the two by **absolute
  instant, not array index** — Xweather stamps carry the location's offset and
  the Met Office publishes UTC, so index-to-index would compare different times.
  Anything more than 30 minutes apart is dropped rather than fudged.
- Without a key the section returns `no_credentials` and the card explains how
  to switch it on, which is a setup step rather than an error.
- **Each DataHub product is a separate subscription and key.** Four are in
  play: site-specific (integrated), map images, land observations, atmospheric
  models. Only site-specific has a request path that could be established from
  outside; `lib/metoffice-discovery.ts` asks the other three where they live and
  `/api/weather/diagnostics` reports the endpoint, identifiers and — for WMTS — the tile
  template under `metofficeProducts`. **Write each client from that answer.**
  Do not guess a path: a wrong path and an unsubscribed product both look like
  "no data", and guessing raster URLs is what took the Xweather map down for
  five rounds. The verdict distinguishes the two — all 404s means the path is
  wrong, a 401 means the path was right and the key was not.
- **Two of the three extra products are order-based, and neither is worth
  integrating.** Atmospheric models deliver gridded GRIB2 against orders placed
  in the portal: hundreds of megabytes, and GRIB2 decoding is not something a
  serverless function should attempt. Map images turn out to work the same way —
  `/map-images/1.0.0/orders`, `/orders/{name}/latest`, `/orders/{name}/latest/
  {fileId}/data`, `/runs?sort=RUNDATETIME`, taken from the Met Office's own
  [map_images_download utility](https://github.com/MetOffice/weather_datahub_utilities)
  rather than guessed — and they are fixed-resolution PNGs of the Global 10 km
  model limited to precipitation rate, surface temperature and MSLP. That is
  not radar, all three parameters already have Xweather rasters, and those
  redraw at any zoom while these do not. Both entries exist so the
  subscriptions are visible, not as a step towards using them.
- **Land observations is the one worth having** — real hourly measurements from
  ~150 stations for the past 48 hours, free at 360 calls a day, and the only
  source here that is a measurement rather than a model. Its product slug is
  at **`/observation-land/1/{geohash}`** — noun order inverted against the
  product's own name, the docs URL and every spelling tried; a bare `1` where
  the other three products use `1.0.0`; and a **six-character geohash** where
  the others take a resource name. None of the three was reachable by
  inference. If a future product goes missing,
  `/api/weather/diagnostics?product=<slug>&version=` tries one from the browser with no
  redeploy. That value reaches a fetch carrying the API key, so it is validated
  against `[a-z0-9-]{1,64}` and the URL is always rebuilt against HOST — never
  interpolated raw.
- **A 4xx is not always a miss.** Both gateway 404s are JSON
  `"type": "Status report"` envelopes; anything else is the product itself
  replying, so even a rejection proves it exists. Land observations answered
  `400 text/plain: "geohash must be exactly 6 chars"` and the probe discarded
  it, because it only recognised 2xx and the resource-not-matched 404 — that
  one response was the entire answer, and it named the request shape.
- **`lib/geohash.ts` encodes WGS84 to geohash** for that path. Checked against
  the canonical worked example and by round-tripping six points through an
  independent decoder; keep those passing if you touch it.
- **The version segment is not always `1.0.0`.** Site-specific lives at
  `/sitespecific/v0/point/hourly`, so a slug that returns product-not-found
  under one version has not been ruled out until the others are tried; pass one
  now sweeps slug × version.
- Probing costs real quota — land observations allows 360 calls a day — so each
  product stops at its first success and diagnostics is the only caller.

## Other open data (no keys)

Every one of these is keyless and Open Government Licence or equivalent, and
each returns a `Section<T>` like the Xweather calls, so a dead source blanks one
card and nothing else. All are covered by `/api/weather/diagnostics`.

| Source | Used for | Notes |
|--------|----------|-------|
| EA flood-monitoring | flood warnings, river gauges, **tide gauges** | one API, three queries; Welsh gauges belong to NRW |
| Defra/NRW bathing water | beach classifications | **returns 403 in production**; the card hides itself, see below |
| Open-Meteo Marine | sea state | 5 km European grid; nothing inland |
| Open-Meteo air quality | **pollen** | 11 km CAMS; Europe only, so it returns `warn_no_data` elsewhere |

- **Tides are measurements, not predictions.** The EA gauge reports observed sea
  level every 15 minutes, so the highs and lows shown have already happened;
  they are found by smoothing the series and fitting a parabola to each turn
  (`findTurningPoints`). Predicted tide tables need an Admiralty subscription.
  The "next high water" line projects forward by the mean lunar interval and is
  labelled an estimate on the card — do not quietly promote it to a prediction.
- **Tide readings come from the measure, not the station.**
  `/id/stations/{id}/readings?since=` answers 200 with an empty list, which is
  why the card kept reporting a silent gauge; `getRiverStations` has meanwhile
  been calling the same route with `?latest` successfully throughout, so it is
  `since=` that the station route does not honour. The series is fetched from
  `/id/measures/{id}/readings?since=` instead, via the station→measures hop the
  river code already proves in production. The measure is picked by qualifier,
  then unit (`mAOD`), then parameter, so a spelling change cannot look like a
  dead gauge.
- **The three hops share one 8s budget and every failure names its hop.**
  Separate 8s and 6s timeouts totalled 14s against Netlify's 10s ceiling, so a
  merely slow lookup guaranteed the readings query was killed and blamed. The
  messages now carry the station, its distance, the measure URI and the raw row
  count — "no readings" was a dead end three rounds running.
- **No fallback chains here.** Trying several URL shapes per hop is what pushed
  the burst of Environment Agency calls past what the service absorbs and took
  river levels down with it. One attempt per hop; if it fails, the message says
  what came back.
- **Bathing water returns 403 and the card removes itself.** Four URL shapes
  were tried, with and without a User-Agent, and every one was refused while
  flood-monitoring — a different service on the same host — answered normally.
  So `BathingBlock` renders nothing when the section is not ok, rather than
  showing a notice that can never clear. The request and the diagnostics entry
  are both still there, so if Defra ever serves it the card reappears on its own.
- **`lib/osgb.ts` converts WGS84 to National Grid** because the bathing water
  service offers no lat/long filter. It is checked against published control
  points (Greenwich and Ben Nevis, both to within ~10 m); keep that test passing
  if you touch it.
- Pollen bands differ per species — birch and alder routinely reach counts that
  would be extraordinary for grass — so `THRESHOLDS` in `lib/pollen.ts` is a
  per-species table, not one shared scale.

## Key Conventions for AI Assistants

1. **Read before writing** — Always read existing files before modifying them
2. **Minimal changes** — Only change what is necessary to accomplish the task
3. **No over-engineering** — Avoid adding abstractions, utilities, or features beyond what was requested
4. **Security first** — Never introduce command injection, XSS, SQL injection, or other vulnerabilities; never commit `.env` files
5. **Don't guess** — If context is missing, ask the user rather than making assumptions
6. **Test your work** — Run `npm run build` after making changes to verify compilation
7. **Keep this file updated** — When adding new tools, scripts, or conventions, update CLAUDE.md accordingly
8. **Respect the stack** — Use Tailwind for styling, App Router conventions for routing, and the Anthropic SDK for AI features
9. **Never import `src/lib/xweather.ts` from a client component** — it reads the Xweather secret. Client components use `src/lib/weather-format.ts` instead.
10. **Weather sections degrade, they don't throw** — every Xweather call returns a `Section<T>` (`{ ok, data, error, code }`). Xweather gates data sets by subscription tier, so render a notice for `ok: false` rather than failing the page.
