"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LeafIcon } from "@/components/weather/icons";
import Link from "next/link";
import { LocationBar, type SavedPlace } from "@/components/weather/LocationBar";
import { TabBar } from "@/components/weather/TabBar";
import { NowPanel } from "@/components/weather/NowPanel";
import { HourlyPanel } from "@/components/weather/HourlyPanel";
import { ForecastPanel } from "@/components/weather/ForecastPanel";
import { RecentPanel } from "@/components/weather/RecentPanel";
import { WeatherHistoryPanel } from "@/components/weather/WeatherHistoryPanel";
import { AirSunPanel } from "@/components/weather/AirSunPanel";
import { WaterPanel } from "@/components/weather/WaterPanel";
import { LocalPanel } from "@/components/weather/LocalPanel";
import { Logo } from "@/components/weather/Logo";
import { ErrorBoundary } from "@/components/weather/ErrorBoundary";
import { CardSkeleton, Notice, Skeleton } from "@/components/weather/ui";
import { relativeFromNow } from "@/lib/weather-format";
import type { ThemeName, UnitSystem, WeatherOverview } from "@/lib/weather-types";

const TABS = [
  { id: "now", label: "Now" },
  { id: "hourly", label: "Hourly" },
  { id: "forecast", label: "10-day" },
  { id: "recent", label: "Last 24h" },
  { id: "history", label: "History" },
  { id: "water", label: "Rivers & Sea" },
  { id: "air", label: "Air & Sun" },
  { id: "local", label: "Local" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STORAGE = {
  place: "wx:place",
  favorites: "wx:favorites",
  units: "wx:units",
  hour12: "wx:hour12",
  theme: "wx:theme",
} as const;

/*
 * Used when geolocation is unavailable or declined and nothing is saved.
 * Coordinates rather than a name on purpose: Xweather's place search resolves
 * "Morriston, Swansea, UK" to Port Talbot ~15km east, and "Swansea, Wales, UK"
 * to the city centre ~5km south. The lat/lon is unambiguous.
 */
const FALLBACK_PLACE: SavedPlace = {
  query: "51.6656,-3.9333",
  label: "Morriston, Swansea",
};

export default function WeatherPage() {
  const [place, setPlace] = useState<SavedPlace | null>(null);
  const [favorites, setFavorites] = useState<SavedPlace[]>([]);
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [hour12, setHour12] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("light");
  const [tab, setTab] = useState<TabId>("now");

  const [overview, setOverview] = useState<WeatherOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  /* Restore preferences, then pick a starting location. */
  useEffect(() => {
    try {
      const savedUnits = localStorage.getItem(STORAGE.units);
      if (savedUnits === "metric" || savedUnits === "imperial") setUnits(savedUnits);
      setHour12(localStorage.getItem(STORAGE.hour12) === "true");
      setTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light"
      );

      const savedFavorites = localStorage.getItem(STORAGE.favorites);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites) as SavedPlace[]);

      const fromUrl = new URLSearchParams(window.location.search).get("p");
      if (fromUrl) {
        setPlace({ query: fromUrl, label: fromUrl });
        return;
      }

      const savedPlace = localStorage.getItem(STORAGE.place);
      if (savedPlace) {
        setPlace(JSON.parse(savedPlace) as SavedPlace);
        return;
      }
    } catch {
      /* corrupt or unavailable storage — fall through to geolocation */
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          setPlace({
            query: `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`,
            label: "My location",
          }),
        () => setPlace(FALLBACK_PLACE),
        { timeout: 8000, maximumAge: 600_000 }
      );
    } else {
      setPlace(FALLBACK_PLACE);
    }
  }, []);

  const load = useCallback(async (target: SavedPlace) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather/overview?p=${encodeURIComponent(target.query)}`
      );
      const payload = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(payload.error ?? "Could not load weather data.");
      setOverview(payload as WeatherOverview);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Could not load weather data.");
      setOverview(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!place) return;
    load(place);
    try {
      localStorage.setItem(STORAGE.place, JSON.stringify(place));
      const url = new URL(window.location.href);
      url.searchParams.set("p", place.query);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* non-fatal */
    }
  }, [place, load]);

  /*
   * The label the user sees comes from the API once it has answered. Deriving
   * it instead of writing it back into `place` matters: `place` is the fetch
   * key, so refining its label in an effect would retrigger the effect below
   * and fetch the whole overview a second time for every location change.
   */
  const displayPlace = useMemo<SavedPlace | null>(
    () =>
      place
        ? { query: place.query, label: overview?.place.displayName || place.label }
        : null,
    [place, overview]
  );

  const persist = useCallback((next: SavedPlace[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(STORAGE.favorites, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!displayPlace) return;
    const exists = favorites.some((f) => f.query === displayPlace.query);
    persist(
      exists
        ? favorites.filter((f) => f.query !== displayPlace.query)
        : [...favorites, displayPlace].slice(-8)
    );
  }, [favorites, displayPlace, persist]);

  const changeUnits = useCallback((next: UnitSystem) => {
    setUnits(next);
    try {
      localStorage.setItem(STORAGE.units, next);
    } catch {
      /* non-fatal */
    }
  }, []);

  const changeTheme = useCallback((next: ThemeName) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE.theme, next);
    } catch {
      /* non-fatal */
    }
  }, []);

  const changeHour12 = useCallback((next: boolean) => {
    setHour12(next);
    try {
      localStorage.setItem(STORAGE.hour12, String(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const lastUpdated = useMemo(
    () => (overview ? relativeFromNow(overview.fetchedAt) : null),
    [overview]
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo size={44} className="shrink-0" />
          <div>
            {/*
              A <p>, not an <h1>: the page's heading is the location in the
              hero, and two h1s on one page is one too many.
            */}
            <p className="wx-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Swansea Weather
            </p>
            {/*
              lang="cy" matters here rather than being decoration: without it a
              screen reader pronounces "Tywydd Abertawe" with English phonetics,
              which is worse than not showing it at all.
            */}
            <p className="wx-welsh" lang="cy">
              Tywydd Abertawe
            </p>
            {/*
              The tagline names what the app actually carries now. "Live data
              from the Vaisala Xweather API" stopped being true once the Met
              Office, the Environment Agency and Open-Meteo joined it — the
              per-card attributions credit each source properly.
            */}
            <p className="wx-muted text-xs">
              Weather, tides and rivers · Swansea Bay and beyond
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="wx-btn inline-flex items-center gap-1.5 text-sm no-underline"
          title="Back to the plant identifier"
        >
          <LeafIcon className="h-4 w-4" aria-hidden />
          Flowerapp
        </Link>
      </header>

      <LocationBar
        current={displayPlace}
        favorites={favorites}
        units={units}
        hour12={hour12}
        theme={theme}
        loading={loading}
        onSelect={setPlace}
        onUnitsChange={changeUnits}
        onHour12Change={changeHour12}
        onThemeChange={changeTheme}
        onToggleFavorite={toggleFavorite}
        onRefresh={() => place && load(place)}
        lastUpdated={lastUpdated}
      />

      <div className="mt-4">
        <TabBar
          tabs={TABS as unknown as { id: string; label: string }[]}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
          ariaLabel="Weather views"
        />
      </div>

      <div className="mt-4">
        {error && (
          <div className="mb-4">
            <Notice tone="warn">{error}</Notice>
          </div>
        )}

        {loading && !overview && <LoadingState />}

        {overview && (
          <ErrorBoundary
            key={`${tab}-${overview.place.id}`}
            label={TABS.find((option) => option.id === tab)?.label ?? tab}
          >
            <div
              className="wx-fade wx-stagger"
              role="tabpanel"
              id={`wx-panel-${tab}`}
              aria-labelledby={`wx-tab-${tab}`}
              tabIndex={0}
            >
            {tab === "now" && (
              <NowPanel
                overview={overview}
                units={units}
                hour12={hour12}
                theme={theme}
              />
            )}
            {tab === "hourly" && (
              <HourlyPanel overview={overview} units={units} hour12={hour12} />
            )}
            {tab === "forecast" && (
              <ForecastPanel overview={overview} units={units} hour12={hour12} />
            )}
            {tab === "recent" && (
              <RecentPanel overview={overview} units={units} hour12={hour12} />
            )}
            {tab === "history" && place && (
              <WeatherHistoryPanel
                placeQuery={place.query}
                units={units}
                hour12={hour12}
              />
            )}
            {tab === "water" && place && (
              <WaterPanel placeQuery={place.query} hour12={hour12} />
            )}
            {tab === "air" && (
              <AirSunPanel overview={overview} units={units} hour12={hour12} />
            )}
            {tab === "local" && place && (
              <LocalPanel placeQuery={place.query} hour12={hour12} />
            )}
            </div>
          </ErrorBoundary>
        )}

        {!overview && !loading && !error && (
          <Notice>Search for a place to get started.</Notice>
        )}
      </div>

      <footer className="wx-dim mt-8 border-t border-slate-400/15 pt-4 text-xs">
        <p>
          Weather data © Vaisala Xweather. Conditions are interpolated for the
          exact coordinates shown; station observations, archives and forecasts
          come from the Xweather Weather API.
        </p>
        {overview && (
          <p className="mt-1">
            {overview.place.lat.toFixed(4)}, {overview.place.lon.toFixed(4)}
            {overview.place.tzname ? ` · ${overview.place.tzname}` : ""}
          </p>
        )}
      </footer>
    </main>
  );
}

function LoadingState() {
  /*
   * Shaped like the Now tab it replaces — hero band, four tiles, two cards — so
   * nothing jumps when the data lands.
   */
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading weather">
      <div className="wx-skeleton" style={{ height: 260, borderRadius: "var(--wx-radius-card)" }} />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="wx-skeleton" style={{ height: 88, borderRadius: "var(--wx-radius-control)" }} />
        ))}
      </div>
      <CardSkeleton height={120} />
      <CardSkeleton height={200} />
    </div>
  );
}
