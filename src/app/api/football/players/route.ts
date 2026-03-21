import { NextRequest, NextResponse } from "next/server";
import { parsePlayerStatsCSV } from "@/lib/football-api";
import { getPlayerStats, setPlayerStats } from "@/lib/player-store";

export async function GET() {
  return NextResponse.json({ players: getPlayerStats() });
}

// Accept CSV upload for player stats (Kaggle / FBref data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const csvText = body.csv as string;

    if (!csvText) {
      return NextResponse.json(
        { error: "CSV data required in request body as { csv: '...' }" },
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
    const message = error instanceof Error ? error.message : "Failed to parse player CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
