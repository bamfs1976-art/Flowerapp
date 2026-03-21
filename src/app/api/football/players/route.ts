import { NextRequest, NextResponse } from "next/server";
import { parsePlayerStatsCSV } from "@/lib/football-api";
import { getPlayerStats, setPlayerStats } from "@/lib/player-store";

export async function GET() {
  return NextResponse.json({ players: getPlayerStats() });
}

// Accept CSV upload or JSON player array
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // JSON player array (from Apify client-side fetch)
    if (Array.isArray(body.players)) {
      setPlayerStats(body.players);
      return NextResponse.json({
        message: `Loaded ${body.players.length} players`,
        count: body.players.length,
      });
    }

    // CSV text upload (manual file upload)
    const csvText = body.csv as string;
    if (!csvText) {
      return NextResponse.json(
        { error: "Provide { csv: '...' } or { players: [...] }" },
        { status: 400 }
      );
    }

    const players = parsePlayerStatsCSV(csvText);
    setPlayerStats(players);

    return NextResponse.json({
      message: `Loaded ${players.length} players with booking data`,
      count: players.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse player data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
