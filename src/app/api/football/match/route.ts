import { NextRequest, NextResponse } from "next/server";
import { getMatchDetail } from "@/lib/football-api";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Match ID required" }, { status: 400 });
  }

  try {
    const data = await getMatchDetail(Number(id));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
