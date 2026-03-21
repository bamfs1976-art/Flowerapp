// Shared in-memory store for uploaded player stats
// Imported by both the players API route and predictions API route

import type { PlayerStats } from "./football-types";

let playerStatsCache: PlayerStats[] = [];

export function getPlayerStats(): PlayerStats[] {
  return playerStatsCache;
}

export function setPlayerStats(players: PlayerStats[]): void {
  playerStatsCache = players;
}
