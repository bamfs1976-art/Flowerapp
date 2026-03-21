"use client";

import type { MatchData, FixtureData } from "@/lib/football-types";

interface MatchCardProps {
  match?: MatchData;
  fixture?: FixtureData;
  compact?: boolean;
}

function formatDate(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function MatchCard({ match, fixture, compact }: MatchCardProps) {
  if (fixture) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {formatDate(fixture.date)} {fixture.time && `• ${fixture.time}`}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            Upcoming
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {fixture.homeTeam}
            </span>
            <span className="text-gray-600">vs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {fixture.awayTeam}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!match) return null;

  const isHomeWin = match.ftResult === "H";
  const isAwayWin = match.ftResult === "A";

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {formatDate(match.date)}
          {match.referee && match.referee !== "Unknown" && ` • ${match.referee}`}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
          FT
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              isHomeWin ? "text-white" : "text-gray-400"
            }`}
          >
            {match.homeTeam}
          </span>
          <span
            className={`text-lg font-bold ${
              isHomeWin ? "text-white" : "text-gray-500"
            }`}
          >
            {match.ftHomeGoals}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              isAwayWin ? "text-white" : "text-gray-400"
            }`}
          >
            {match.awayTeam}
          </span>
          <span
            className={`text-lg font-bold ${
              isAwayWin ? "text-white" : "text-gray-500"
            }`}
          >
            {match.ftAwayGoals}
          </span>
        </div>
      </div>

      {/* Card and stats info */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-3 text-xs text-gray-500">
          {match.totalCards > 0 && (
            <span className="text-yellow-400">
              🟨 {match.homeYellows + match.awayYellows}
              {(match.homeReds + match.awayReds) > 0 &&
                ` 🟥 ${match.homeReds + match.awayReds}`}
            </span>
          )}
          <span>⚡ {match.homeFouls + match.awayFouls} fouls</span>
          <span>📐 {match.homeCorners + match.awayCorners} corners</span>
        </div>
      )}
    </div>
  );
}
