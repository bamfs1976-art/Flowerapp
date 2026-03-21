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
      <div className="glass-card rounded-2xl p-4 transition-all duration-200 hover:bg-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-white/30 font-medium tracking-wide uppercase">
            {formatDate(fixture.date)} {fixture.time && `\u00b7 ${fixture.time}`}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/[0.12] text-blue-400 font-semibold tracking-wide">
            UPCOMING
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-white/80">
              {fixture.homeTeam}
            </span>
            <span className="text-white/20 text-[11px] font-medium">vs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-white/80">
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
    <div className="glass-card rounded-2xl p-4 transition-all duration-200 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-white/30 font-medium tracking-wide">
          {formatDate(match.date)}
          {match.referee && match.referee !== "Unknown" && ` \u00b7 ${match.referee}`}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-semibold tracking-wider">
          FT
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-[14px] font-medium ${isHomeWin ? "text-white" : "text-white/45"}`}>
            {match.homeTeam}
          </span>
          <span className={`text-lg font-bold tabular-nums ${isHomeWin ? "text-white" : "text-white/30"}`}>
            {match.ftHomeGoals}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[14px] font-medium ${isAwayWin ? "text-white" : "text-white/45"}`}>
            {match.awayTeam}
          </span>
          <span className={`text-lg font-bold tabular-nums ${isAwayWin ? "text-white" : "text-white/30"}`}>
            {match.ftAwayGoals}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-4 text-[11px] text-white/30">
          {match.totalCards > 0 && (
            <span className="text-yellow-400/70">
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
