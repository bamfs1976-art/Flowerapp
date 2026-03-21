import { NextResponse } from "next/server";
import { getAllLeagueMatches, getFixtures } from "@/lib/football-api";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Check both finished matches and upcoming fixtures
    const [matches, fixtures] = await Promise.all([
      getAllLeagueMatches(),
      getFixtures(),
    ]);

    const todayMatches = matches.filter((m) => m.date === today);
    const todayFixtures = fixtures.filter((f) => f.date === today);

    return NextResponse.json({
      matches: todayMatches,
      fixtures: todayFixtures,
      date: today,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch today's data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
