import { NextRequest, NextResponse } from "next/server";
import { getFixtures } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("competition");

  try {
    let fixtures = await getFixtures();

    if (league) {
      fixtures = fixtures.filter((f) => f.leagueCode === league);
    }

    return NextResponse.json({ fixtures });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fixtures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
