import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, getAllLeagueMatches } from "@/lib/football-api";
import type { LeagueCode } from "@/lib/football-types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("competition") as LeagueCode | null;
  const limit = parseInt(params.get("limit") || "0") || 0;

  try {
    let matches;
    if (code) {
      matches = await getLeagueMatches(code);
    } else {
      matches = await getAllLeagueMatches();
    }

    // Sort by date descending (most recent first)
    matches.sort((a, b) => b.date.localeCompare(a.date));

    if (limit > 0) {
      matches = matches.slice(0, limit);
    }

    return NextResponse.json({ matches, total: matches.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch matches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
