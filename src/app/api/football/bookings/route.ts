import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, getAllLeagueMatches } from "@/lib/football-api";
import { analyzeBookings } from "@/lib/booking-analytics";
import type { LeagueCode } from "@/lib/football-types";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("competition") as LeagueCode | null;

  try {
    let matches;
    if (code) {
      matches = await getLeagueMatches(code);
    } else {
      matches = await getAllLeagueMatches();
    }

    const analytics = analyzeBookings(matches);
    return NextResponse.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
