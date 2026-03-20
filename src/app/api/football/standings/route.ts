import { NextRequest, NextResponse } from "next/server";
import { getStandings } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("competition") || "PL";

  try {
    const data = await getStandings(code);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch standings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
