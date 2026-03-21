// CSV-based football data fetcher with server-side caching
// Sources: football-data.co.uk, GitHub datasets

import type { CsvMatchRow, MatchData, FixtureData, LeagueCode } from "./football-types";
import { CSV_LEAGUES } from "./football-types";

// ── CSV cache ──

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const matchCache = new Map<string, CacheEntry<MatchData[]>>();
const fixtureCache: CacheEntry<FixtureData[]> | null = null;
let fixtureCacheRef: CacheEntry<FixtureData[]> | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function isCacheValid<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  return entry != null && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

// ── CSV parsing ──

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Handle BOM
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xfeff) {
    headerLine = headerLine.slice(1);
  }

  const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < headers.length / 2) continue; // skip obviously broken rows

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || "").trim().replace(/"/g, "");
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

// ── Date parsing ──

function parseDateDDMMYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;

  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  let year = parts[2];

  // Handle 2-digit years
  if (year.length === 2) {
    year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
  }

  return `${year}-${month}-${day}`;
}

// ── CSV row → MatchData ──

function csvRowToMatch(row: Record<string, string>, leagueCode: string): MatchData | null {
  const homeTeam = row.HomeTeam || row.Home;
  const awayTeam = row.AwayTeam || row.Away;
  if (!homeTeam || !awayTeam) return null;

  const fthg = parseInt(row.FTHG) || 0;
  const ftag = parseInt(row.FTAG) || 0;
  const hy = parseInt(row.HY) || 0;
  const ay = parseInt(row.AY) || 0;
  const hr = parseInt(row.HR) || 0;
  const ar = parseInt(row.AR) || 0;

  const dateStr = row.Date || "";
  const isoDate = parseDateDDMMYY(dateStr);

  const league = CSV_LEAGUES.find((l) => l.code === leagueCode);

  return {
    id: `${leagueCode}-${isoDate}-${homeTeam}-${awayTeam}`.replace(/\s+/g, "-"),
    league: league?.name || leagueCode,
    leagueCode,
    date: isoDate,
    time: row.Time || "",
    homeTeam,
    awayTeam,
    ftHomeGoals: fthg,
    ftAwayGoals: ftag,
    ftResult: (row.FTR || "D") as "H" | "D" | "A",
    htHomeGoals: parseInt(row.HTHG) || 0,
    htAwayGoals: parseInt(row.HTAG) || 0,
    htResult: row.HTR || "",
    referee: row.Referee || "Unknown",
    homeShots: parseInt(row.HS) || 0,
    awayShots: parseInt(row.AS) || 0,
    homeShotsOnTarget: parseInt(row.HST) || 0,
    awayShotsOnTarget: parseInt(row.AST) || 0,
    homeFouls: parseInt(row.HF) || 0,
    awayFouls: parseInt(row.AF) || 0,
    homeCorners: parseInt(row.HC) || 0,
    awayCorners: parseInt(row.AC) || 0,
    homeYellows: hy,
    awayYellows: ay,
    homeReds: hr,
    awayReds: ar,
    totalCards: hy + ay + hr + ar,
    isFinished: !!(row.FTR && row.FTHG !== undefined),
  };
}

// ── Data fetching ──

const CSV_BASE = "https://www.football-data.co.uk/mmz4281/2526";
const GITHUB_PL_URL =
  "https://raw.githubusercontent.com/datasets/football-datasets/main/datasets/premier-league/season-2526.csv";
const FIXTURES_URL = "https://www.football-data.co.uk/fixtures.csv";

async function fetchCSV(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FootballAnalytics/1.0)",
      Accept: "text/csv, text/plain, */*",
    },
    next: { revalidate: 1800 }, // 30 min ISR
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.text();
}

// Fetch match data for a league
export async function getLeagueMatches(leagueCode: LeagueCode): Promise<MatchData[]> {
  const cached = matchCache.get(leagueCode);
  if (isCacheValid(cached)) return cached.data;

  const urls: string[] = [];

  // Primary source: football-data.co.uk
  urls.push(`${CSV_BASE}/${leagueCode}.csv`);

  // For Premier League, also try GitHub dataset as fallback
  if (leagueCode === "E0") {
    urls.push(GITHUB_PL_URL);
  }

  let matches: MatchData[] = [];

  for (const url of urls) {
    try {
      const csv = await fetchCSV(url);
      const rows = parseCSV(csv);
      matches = rows
        .map((row) => csvRowToMatch(row, leagueCode))
        .filter((m): m is MatchData => m !== null);

      if (matches.length > 0) break;
    } catch {
      // Try next URL
      continue;
    }
  }

  // Sort by date descending
  matches.sort((a, b) => b.date.localeCompare(a.date));

  matchCache.set(leagueCode, { data: matches, fetchedAt: Date.now() });
  return matches;
}

// Fetch all leagues
export async function getAllLeagueMatches(): Promise<MatchData[]> {
  const results = await Promise.allSettled(
    CSV_LEAGUES.map((l) => getLeagueMatches(l.code as LeagueCode))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// Fetch upcoming fixtures
export async function getFixtures(): Promise<FixtureData[]> {
  if (isCacheValid(fixtureCacheRef)) return fixtureCacheRef.data;

  try {
    const csv = await fetchCSV(FIXTURES_URL);
    const rows = parseCSV(csv);

    const fixtures: FixtureData[] = rows
      .map((row) => {
        const homeTeam = row.HomeTeam || row.Home;
        const awayTeam = row.AwayTeam || row.Away;
        const div = row.Div || "";
        if (!homeTeam || !awayTeam) return null;

        const league = CSV_LEAGUES.find((l) => l.code === div);

        return {
          id: `fix-${div}-${row.Date}-${homeTeam}-${awayTeam}`.replace(/\s+/g, "-"),
          league: league?.name || div,
          leagueCode: div,
          date: parseDateDDMMYY(row.Date || ""),
          time: row.Time || "",
          homeTeam,
          awayTeam,
        };
      })
      .filter((f): f is FixtureData => f !== null);

    // Filter to only known leagues
    const knownCodes = new Set<string>(CSV_LEAGUES.map((l) => l.code));
    const filtered = fixtures.filter((f) => knownCodes.has(f.leagueCode));

    fixtureCacheRef = { data: filtered, fetchedAt: Date.now() };
    return filtered;
  } catch {
    return [];
  }
}

// Compute standings from match results
export function computeStandings(matches: MatchData[]): import("./football-types").ComputedStanding[] {
  const teamMap = new Map<
    string,
    {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      gf: number;
      ga: number;
      points: number;
      results: string[];
      homeW: number; homeD: number; homeL: number;
      awayW: number; awayD: number; awayL: number;
      yellows: number;
      reds: number;
    }
  >();

  const getTeam = (name: string) => {
    if (!teamMap.has(name)) {
      teamMap.set(name, {
        played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, points: 0, results: [],
        homeW: 0, homeD: 0, homeL: 0,
        awayW: 0, awayD: 0, awayL: 0,
        yellows: 0, reds: 0,
      });
    }
    return teamMap.get(name)!;
  };

  // Sort matches by date ascending for form calculation
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const match of sorted) {
    if (!match.isFinished) continue;

    const home = getTeam(match.homeTeam);
    const away = getTeam(match.awayTeam);

    home.played++;
    away.played++;
    home.gf += match.ftHomeGoals;
    home.ga += match.ftAwayGoals;
    away.gf += match.ftAwayGoals;
    away.ga += match.ftHomeGoals;
    home.yellows += match.homeYellows;
    home.reds += match.homeReds;
    away.yellows += match.awayYellows;
    away.reds += match.awayReds;

    if (match.ftResult === "H") {
      home.won++; home.points += 3; home.homeW++;
      away.lost++; away.awayL++;
      home.results.push("W");
      away.results.push("L");
    } else if (match.ftResult === "A") {
      away.won++; away.points += 3; away.awayW++;
      home.lost++; home.homeL++;
      home.results.push("L");
      away.results.push("W");
    } else {
      home.drawn++; home.points += 1; home.homeD++;
      away.drawn++; away.points += 1; away.awayD++;
      home.results.push("D");
      away.results.push("D");
    }
  }

  const standings = Array.from(teamMap.entries())
    .map(([team, data]) => ({
      position: 0,
      team,
      played: data.played,
      won: data.won,
      drawn: data.drawn,
      lost: data.lost,
      goalsFor: data.gf,
      goalsAgainst: data.ga,
      goalDifference: data.gf - data.ga,
      points: data.points,
      form: data.results.slice(-5),
      homeRecord: { w: data.homeW, d: data.homeD, l: data.homeL },
      awayRecord: { w: data.awayW, d: data.awayD, l: data.awayL },
      totalYellows: data.yellows,
      totalReds: data.reds,
      cardsPerMatch: data.played > 0
        ? Math.round(((data.yellows + data.reds) / data.played) * 100) / 100
        : 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  standings.forEach((s, i) => (s.position = i + 1));
  return standings;
}

// Parse player stats CSV (Kaggle / FBref format)
export function parsePlayerStatsCSV(csvText: string): import("./football-types").PlayerStats[] {
  const rows = parseCSV(csvText);

  return rows
    .map((row) => {
      const player = row.Player || row.player || "";
      const mp = parseInt(row.MP || row.matches_played || "0") || 0;
      const yellows = parseInt(row.CrdY || row.yellow_cards || row.YellowCards || "0") || 0;
      const reds = parseInt(row.CrdR || row.red_cards || row.RedCards || "0") || 0;
      const minutes = parseInt(row.Min || row.minutes || "0") || 0;

      if (!player || mp === 0) return null;

      const totalCards = yellows + reds;

      return {
        player,
        nation: row.Nation || row.nation || "",
        position: row.Pos || row.position || "",
        squad: row.Squad || row.squad || row.Team || "",
        competition: row.Comp || row.competition || row.League || "",
        age: parseInt(row.Age || row.age || "0") || 0,
        matchesPlayed: mp,
        starts: parseInt(row.Starts || row.starts || "0") || 0,
        minutes,
        goals: parseInt(row.Gls || row.goals || "0") || 0,
        assists: parseInt(row.Ast || row.assists || "0") || 0,
        yellowCards: yellows,
        redCards: reds,
        totalCards,
        cardsPerMatch: mp > 0 ? Math.round((totalCards / mp) * 100) / 100 : 0,
        cardsPerNinety: minutes > 0 ? Math.round((totalCards / (minutes / 90)) * 100) / 100 : 0,
        minutesPerCard: totalCards > 0 ? Math.round(minutes / totalCards) : 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.totalCards > 0);
}

// Clear all caches (useful for manual refresh)
export function clearCache() {
  matchCache.clear();
  fixtureCacheRef = null;
}
