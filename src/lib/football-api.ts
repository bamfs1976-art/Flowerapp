// Football-Data.org API v4 client with server-side caching

const API_BASE = "https://api.football-data.org/v4";

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

const CACHE_TTL = {
  COMPETITIONS: 24 * 60 * 60 * 1000, // 24 hours
  STANDINGS: 30 * 60 * 1000,          // 30 minutes
  MATCHES: 5 * 60 * 1000,             // 5 minutes
  MATCH_DETAIL: 60 * 60 * 1000,       // 1 hour (finished matches rarely change)
  MATCH_DETAIL_LIVE: 30 * 1000,       // 30 seconds for live matches
};

async function apiFetch<T>(path: string, ttl: number): Promise<T> {
  const cacheKey = path;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY environment variable is not set");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
    next: { revalidate: Math.floor(ttl / 1000) },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Football API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  setCache(cacheKey, data, ttl);
  return data as T;
}

// ── Competitions ──

export async function getCompetitions() {
  const data = await apiFetch<{ competitions: unknown[] }>(
    "/competitions",
    CACHE_TTL.COMPETITIONS
  );
  return data.competitions;
}

export async function getCompetition(code: string) {
  return apiFetch<unknown>(
    `/competitions/${code}`,
    CACHE_TTL.COMPETITIONS
  );
}

// ── Standings ──

export async function getStandings(competitionCode: string) {
  return apiFetch<{ standings: unknown[] }>(
    `/competitions/${competitionCode}/standings`,
    CACHE_TTL.STANDINGS
  );
}

// ── Matches ──

export async function getCompetitionMatches(
  competitionCode: string,
  filters?: { status?: string; matchday?: number; dateFrom?: string; dateTo?: string }
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.matchday) params.set("matchday", String(filters.matchday));
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<{ matches: unknown[] }>(
    `/competitions/${competitionCode}/matches${qs}`,
    CACHE_TTL.MATCHES
  );
}

export async function getMatchDetail(matchId: number) {
  return apiFetch<unknown>(
    `/matches/${matchId}`,
    CACHE_TTL.MATCH_DETAIL
  );
}

export async function getTodaysMatches() {
  return apiFetch<{ matches: unknown[] }>(
    "/matches",
    CACHE_TTL.MATCHES
  );
}

// ── Teams ──

export async function getTeam(teamId: number) {
  return apiFetch<unknown>(`/teams/${teamId}`, CACHE_TTL.COMPETITIONS);
}

// ── Scorers ──

export async function getScorers(competitionCode: string) {
  return apiFetch<{ scorers: unknown[] }>(
    `/competitions/${competitionCode}/scorers`,
    CACHE_TTL.STANDINGS
  );
}
