import { NextRequest, NextResponse } from "next/server";
import { fetchTransfermarktPlayers, getCacheStatus } from "@/lib/apify-transfermarkt";
import { getPlayerStats, setPlayerStats } from "@/lib/player-store";
import type { LeagueCode, PlayerStats } from "@/lib/football-types";

// GET — Fetch player card data from Transfermarkt via Apify
// Auto-fetches on first request, then serves from 24h cache
export async function GET(request: NextRequest) {
  const league = (request.nextUrl.searchParams.get("competition") || "E0") as LeagueCode;

  // Check if we already have data in the player store
  const existing = getPlayerStats();
  const cache = getCacheStatus(league);

  if (cache.cached) {
    return NextResponse.json({
      players: existing,
      source: "cache",
      cacheAge: cache.age,
      count: cache.count,
    });
  }

  // Fetch from Apify/Transfermarkt
  const result = await fetchTransfermarktPlayers(league);

  if (result.error) {
    // Return existing data if available, with the error
    return NextResponse.json({
      players: existing,
      source: "fallback",
      error: result.error,
      count: existing.length,
    }, { status: existing.length > 0 ? 200 : 502 });
  }

  if (result.players.length > 0) {
    // Merge with any existing CSV-uploaded data (Apify data supplements, doesn't replace)
    const merged = mergePlayerData(existing, result.players);
    setPlayerStats(merged);

    return NextResponse.json({
      players: merged,
      source: result.fromCache ? "cache" : "apify",
      count: merged.length,
      apifyCount: result.players.length,
    });
  }

  return NextResponse.json({
    players: existing,
    source: "existing",
    count: existing.length,
  });
}

// Merge Apify-fetched players with manually uploaded CSV players
// CSV data takes priority for matching players (user-provided data is more trusted)
function mergePlayerData(
  csvPlayers: PlayerStats[],
  apifyPlayers: PlayerStats[]
): PlayerStats[] {
  const seen = new Set(
    csvPlayers.map((p) => `${p.player.toLowerCase()}|${p.squad.toLowerCase()}`)
  );

  const newPlayers = apifyPlayers.filter(
    (p) => !seen.has(`${p.player.toLowerCase()}|${p.squad.toLowerCase()}`)
  );

  return [...csvPlayers, ...newPlayers];
}
