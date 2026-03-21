import { NextRequest, NextResponse } from "next/server";
import { getLeagueMatches, getAllLeagueMatches } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Match ID required" }, { status: 400 });
  }

  try {
    const allMatches = await getAllLeagueMatches();
    const match = allMatches.find((m) => m.id === id);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
