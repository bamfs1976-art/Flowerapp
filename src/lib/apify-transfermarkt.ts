// Apify Transfermarkt integration — fetches player card stats via curious_coder/transfermarkt
// Uses the Transfermarkt "leistungsdaten" (performance data) pages which include
// appearances, goals, assists, yellow cards, second yellows, red cards, and minutes

import type { PlayerStats } from "./football-types";

const ACTOR_ID = "curious_coder~transfermarkt";

// Map our league codes to Transfermarkt competition codes and URLs
const LEAGUE_TM_MAP: Record<string, { tmCode: string; name: string }> = {
  E0:  { tmCode: "GB1", name: "premier-league" },
  D1:  { tmCode: "L1",  name: "1-bundesliga" },
  I1:  { tmCode: "IT1", name: "serie-a" },
  SP1: { tmCode: "ES1", name: "la-liga" },
  F1:  { tmCode: "FR1", name: "ligue-1" },
  N1:  { tmCode: "NL1", name: "eredivisie" },
  P1:  { tmCode: "PO1", name: "liga-portugal" },
  E1:  { tmCode: "GB2", name: "championship" },
};

// 24-hour cache for scraped player data
interface CacheEntry {
  data: PlayerStats[];
  timestamp: number;
}

const playerCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Active fetch promises to prevent duplicate concurrent requests
const activeFetches = new Map<string, Promise<PlayerStats[]>>();

function getCachedPlayers(leagueCode: string): PlayerStats[] | null {
  const entry = playerCache.get(leagueCode);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCachedPlayers(leagueCode: string, data: PlayerStats[]): void {
  playerCache.set(leagueCode, { data, timestamp: Date.now() });
}

// Build the Transfermarkt URL for a league's player performance data
function buildTransfermarktUrl(leagueCode: string): string | null {
  const league = LEAGUE_TM_MAP[leagueCode];
  if (!league) return null;

  // Current season: 2025 = 2025/26 season
  const seasonId = 2025;

  // "leistungsdaten" page shows every player with stats including cards
  return `https://www.transfermarkt.com/${league.name}/leistungsdaten/wettbewerb/${league.tmCode}/plus/1?saison_id=${seasonId}`;
}

// Parse raw Apify scraper output into our PlayerStats format
function parseTransfermarktData(items: Record<string, unknown>[]): PlayerStats[] {
  const players: PlayerStats[] = [];

  for (const item of items) {
    // The curious_coder/transfermarkt scraper returns varied formats
    // depending on the page type. For leistungsdaten pages, we expect
    // player rows with stats fields.

    // Try to extract player data from the item
    const player = extractPlayerFromItem(item);
    if (player && player.matchesPlayed > 0 && player.totalCards > 0) {
      players.push(player);
    }

    // If the item contains nested player arrays (some scrapers return this)
    const nestedPlayers = (item.players || item.data || item.items || item.results) as Record<string, unknown>[] | undefined;
    if (Array.isArray(nestedPlayers)) {
      for (const nested of nestedPlayers) {
        const p = extractPlayerFromItem(nested);
        if (p && p.matchesPlayed > 0 && p.totalCards > 0) {
          players.push(p);
        }
      }
    }
  }

  return players;
}

function extractPlayerFromItem(item: Record<string, unknown>): PlayerStats | null {
  // Flexible field extraction — the scraper may use different field names
  const player =
    str(item.playerName) || str(item.player) || str(item.name) ||
    str(item.Player) || str(item.fullName) || "";
  if (!player) return null;

  const mp = num(item.appearances) || num(item.matchesPlayed) || num(item.games) ||
    num(item.MP) || num(item.matches) || 0;
  if (mp === 0) return null;

  const yellows = num(item.yellowCards) || num(item.yellow_cards) || num(item.yellows) ||
    num(item.CrdY) || num(item.cautions) || 0;
  const secondYellows = num(item.secondYellowCards) || num(item.second_yellow_cards) ||
    num(item.yellowRed) || num(item.secondYellow) || 0;
  const reds = num(item.redCards) || num(item.red_cards) || num(item.reds) ||
    num(item.CrdR) || num(item.dismissals) || 0;
  const minutes = num(item.minutesPlayed) || num(item.minutes) || num(item.Min) ||
    num(item.mins) || 0;

  const totalCards = yellows + secondYellows + reds;
  if (totalCards === 0) return null;

  const squad = str(item.club) || str(item.team) || str(item.squad) ||
    str(item.Squad) || str(item.clubName) || "";
  const position = str(item.position) || str(item.pos) || str(item.Pos) || "";
  const nation = str(item.nationality) || str(item.nation) || str(item.Nation) ||
    str(item.country) || "";

  return {
    player,
    nation,
    position,
    squad,
    competition: str(item.competition) || str(item.league) || str(item.Comp) || "",
    age: num(item.age) || num(item.Age) || 0,
    matchesPlayed: mp,
    starts: num(item.starts) || num(item.Starts) || 0,
    minutes,
    goals: num(item.goals) || num(item.Gls) || 0,
    assists: num(item.assists) || num(item.Ast) || 0,
    yellowCards: yellows + secondYellows,
    redCards: reds,
    totalCards,
    cardsPerMatch: mp > 0 ? Math.round((totalCards / mp) * 100) / 100 : 0,
    cardsPerNinety: minutes > 0 ? Math.round((totalCards / (minutes / 90)) * 100) / 100 : 0,
    minutesPerCard: totalCards > 0 ? Math.round(minutes / totalCards) : 0,
  };
}

function str(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function num(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseInt(val.replace(/[.,]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// Fetch player stats from Transfermarkt via Apify
export async function fetchTransfermarktPlayers(
  leagueCode: string
): Promise<{ players: PlayerStats[]; fromCache: boolean; error?: string }> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    return { players: [], fromCache: false, error: "APIFY_API_TOKEN not configured" };
  }

  // Check cache first
  const cached = getCachedPlayers(leagueCode);
  if (cached) {
    return { players: cached, fromCache: true };
  }

  // Prevent duplicate concurrent fetches for the same league
  const existingFetch = activeFetches.get(leagueCode);
  if (existingFetch) {
    const players = await existingFetch;
    return { players, fromCache: false };
  }

  const url = buildTransfermarktUrl(leagueCode);
  if (!url) {
    return { players: [], fromCache: false, error: `Unknown league code: ${leagueCode}` };
  }

  const fetchPromise = (async (): Promise<PlayerStats[]> => {
    try {
      // Run the actor synchronously and get dataset items directly
      const apiUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apiToken}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxItems: 500,
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Apify API error ${response.status}: ${errorText}`);
      }

      const items = await response.json() as Record<string, unknown>[];
      const players = parseTransfermarktData(items);

      if (players.length > 0) {
        setCachedPlayers(leagueCode, players);
      }

      return players;
    } finally {
      activeFetches.delete(leagueCode);
    }
  })();

  activeFetches.set(leagueCode, fetchPromise);

  try {
    const players = await fetchPromise;
    return { players, fromCache: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch from Apify";
    return { players: [], fromCache: false, error: message };
  }
}

// Get all cached players across all leagues
export function getAllCachedPlayers(): PlayerStats[] {
  const all: PlayerStats[] = [];
  for (const [, entry] of playerCache) {
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      all.push(...entry.data);
    }
  }
  return all;
}

// Check cache status for a league
export function getCacheStatus(leagueCode: string): {
  cached: boolean;
  age?: number;
  count?: number;
} {
  const entry = playerCache.get(leagueCode);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return {
      cached: true,
      age: Math.round((Date.now() - entry.timestamp) / 60000), // minutes
      count: entry.data.length,
    };
  }
  return { cached: false };
}
