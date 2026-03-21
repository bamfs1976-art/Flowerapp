// Client-side Apify Transfermarkt fetcher
// Calls Apify directly from the browser to bypass server proxy restrictions,
// then posts parsed player data to the server's player store.

import type { PlayerStats } from "./football-types";

const ACTOR_ID = "curious_coder~transfermarkt";

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

// Simple client-side cache to avoid re-fetching during the session
const clientCache = new Map<string, { players: PlayerStats[]; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function buildUrl(leagueCode: string): string | null {
  const league = LEAGUE_TM_MAP[leagueCode];
  if (!league) return null;
  return `https://www.transfermarkt.com/${league.name}/leistungsdaten/wettbewerb/${league.tmCode}/plus/1?saison_id=2025`;
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

function parseItem(item: Record<string, unknown>): PlayerStats | null {
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
  const minutes = num(item.minutesPlayed) || num(item.minutes) || num(item.Min) || 0;

  const totalCards = yellows + secondYellows + reds;
  if (totalCards === 0) return null;

  return {
    player,
    nation: str(item.nationality) || str(item.nation) || str(item.Nation) || "",
    position: str(item.position) || str(item.pos) || str(item.Pos) || "",
    squad: str(item.club) || str(item.team) || str(item.squad) || str(item.Squad) || "",
    competition: str(item.competition) || str(item.league) || "",
    age: num(item.age) || 0,
    matchesPlayed: mp,
    starts: num(item.starts) || 0,
    minutes,
    goals: num(item.goals) || 0,
    assists: num(item.assists) || 0,
    yellowCards: yellows + secondYellows,
    redCards: reds,
    totalCards,
    cardsPerMatch: mp > 0 ? Math.round((totalCards / mp) * 100) / 100 : 0,
    cardsPerNinety: minutes > 0 ? Math.round((totalCards / (minutes / 90)) * 100) / 100 : 0,
    minutesPerCard: totalCards > 0 ? Math.round(minutes / totalCards) : 0,
  };
}

function parseItems(items: Record<string, unknown>[]): PlayerStats[] {
  const players: PlayerStats[] = [];
  for (const item of items) {
    const p = parseItem(item);
    if (p) players.push(p);

    // Handle nested arrays
    const nested = (item.players || item.data || item.items || item.results) as Record<string, unknown>[] | undefined;
    if (Array.isArray(nested)) {
      for (const n of nested) {
        const np = parseItem(n);
        if (np) players.push(np);
      }
    }
  }
  return players;
}

export interface ApifyResult {
  players: PlayerStats[];
  source: "apify" | "cache" | "server" | "error";
  count: number;
  error?: string;
}

export async function fetchPlayersFromApify(leagueCode: string): Promise<ApifyResult> {
  // Check client-side cache
  const cached = clientCache.get(leagueCode);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { players: cached.players, source: "cache", count: cached.players.length };
  }

  const token = process.env.NEXT_PUBLIC_APIFY_API_TOKEN;
  if (!token) {
    // Fall back to server-side data
    return fetchFromServer();
  }

  const tmUrl = buildUrl(leagueCode);
  if (!tmUrl) {
    return fetchFromServer();
  }

  try {
    const apiUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: tmUrl }],
        maxItems: 500,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(`Apify API error ${response.status}`);
    }

    const items = await response.json() as Record<string, unknown>[];
    const players = parseItems(items);

    if (players.length > 0) {
      // Cache locally
      clientCache.set(leagueCode, { players, ts: Date.now() });

      // Send to server so predictions can use them
      try {
        await fetch("/api/football/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players }),
        });
      } catch {
        // Non-critical
      }

      return { players, source: "apify", count: players.length };
    }

    return fetchFromServer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apify fetch failed";
    // Fall back to server data
    const server = await fetchFromServer();
    if (server.count > 0) return server;
    return { players: [], source: "error", count: 0, error: msg };
  }
}

async function fetchFromServer(): Promise<ApifyResult> {
  try {
    const res = await fetch("/api/football/players");
    const data = await res.json();
    if (data.players && data.players.length > 0) {
      return { players: data.players, source: "server", count: data.players.length };
    }
  } catch {
    // ignore
  }
  return { players: [], source: "server", count: 0 };
}
