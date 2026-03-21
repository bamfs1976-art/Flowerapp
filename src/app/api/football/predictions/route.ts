import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, getAllLeagueMatches, getFixtures } from "@/lib/football-api";
import { analyzeBookings, generatePredictions } from "@/lib/booking-analytics";
import { getPlayerStats } from "@/lib/player-store";
import { getRefereeAssignments } from "@/lib/referee-assignments";
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

    // Get uploaded player stats directly from shared store
    const players = getPlayerStats();

    const analytics = analyzeBookings(matches, players);
    const predictions = generatePredictions(fixtures, analytics, matches);

    const refAssignments = getRefereeAssignments();

    return NextResponse.json({
      predictions,
      meta: {
        fixtureCount: fixtures.length,
        matchesAnalyzed: analytics.totalMatchesAnalyzed,
        hasPlayerData: players.length > 0,
        hasRefereeAssignments: refAssignments.length > 0,
        leagueAvgCards: analytics.averageCardsPerMatch,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
