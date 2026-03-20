import { NextRequest, NextResponse } from "next/server";
import { getCompetitionMatches } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("competition") || "PL";
  const status = params.get("status") || undefined;
  const matchday = params.get("matchday")
    ? Number(params.get("matchday"))
    : undefined;
  const dateFrom = params.get("dateFrom") || undefined;
  const dateTo = params.get("dateTo") || undefined;

  try {
    const data = await getCompetitionMatches(code, {
      status,
      matchday,
      dateFrom,
      dateTo,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch matches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
