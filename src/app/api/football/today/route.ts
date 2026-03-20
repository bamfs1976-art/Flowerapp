import { NextResponse } from "next/server";
import { getTodaysMatches } from "@/lib/football-api";

export async function GET() {
  try {
    const data = await getTodaysMatches();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch today's matches";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
