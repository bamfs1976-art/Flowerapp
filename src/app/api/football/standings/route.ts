import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, computeStandings } from "@/lib/football-api";
import type { LeagueCode } from "@/lib/football-types";

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("competition") || "E0") as LeagueCode;

  try {
    const matches = await getLeagueMatches(code);
    const standings = computeStandings(matches);
    return NextResponse.json({ standings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute standings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
