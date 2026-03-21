import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, getAllLeagueMatches, getFixtures } from "@/lib/football-api";
import { analyzeBookings, generatePredictions } from "@/lib/booking-analytics";
import type { LeagueCode } from "@/lib/football-types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("competition") as LeagueCode | null;

  try {
    // Fetch matches and fixtures in parallel
    const [matches, allFixtures] = await Promise.all([
      code ? getLeagueMatches(code) : getAllLeagueMatches(),
      getFixtures(),
    ]);

    const fixtures = code
      ? allFixtures.filter((f) => f.leagueCode === code)
      : allFixtures;

    // Also fetch any uploaded player stats
    const playerRes = await fetch(
      new URL("/api/football/players", request.nextUrl.origin)
    ).catch(() => null);
    const playerData = playerRes?.ok
      ? await playerRes.json()
      : { players: [] };

    const analytics = analyzeBookings(matches, playerData.players || []);
    const predictions = generatePredictions(fixtures, analytics, matches);

    return NextResponse.json({
      predictions,
      meta: {
        fixtureCount: fixtures.length,
        matchesAnalyzed: analytics.totalMatchesAnalyzed,
        hasPlayerData: (playerData.players?.length || 0) > 0,
        leagueAvgCards: analytics.averageCardsPerMatch,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
