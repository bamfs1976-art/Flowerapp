"use client";

import type { Match } from "@/lib/football-types";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  onClick?: () => void;
}

function formatDate(utcDate: string) {
  const d = new Date(utcDate);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(utcDate: string) {
  const d = new Date(utcDate);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string) {
  switch (status) {
    case "FINISHED":
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">FT</span>;
    case "IN_PLAY":
    case "PAUSED":
      return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">LIVE</span>;
    case "SCHEDULED":
    case "TIMED":
      return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{formatTime(status === "TIMED" ? "" : "")}</span>;
    default:
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{status}</span>;
  }
}

export default function MatchCard({ match, compact, onClick }: MatchCardProps) {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const bookingCount = match.bookings?.length ?? 0;

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 transition-all hover:border-gray-600 ${
        onClick ? "cursor-pointer hover:bg-gray-800" : ""
      } ${isLive ? "ring-1 ring-red-500/30" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {formatDate(match.utcDate)} {!isFinished && `• ${formatTime(match.utcDate)}`}
          {match.matchday ? ` • MD ${match.matchday}` : ""}
        </span>
        {statusBadge(match.status)}
      </div>

      <div className="space-y-2">
        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.homeTeam.crest && (
              <img
                src={match.homeTeam.crest}
                alt=""
                className="w-5 h-5 object-contain"
              />
            )}
            <span
              className={`text-sm font-medium ${
                isFinished && match.score.winner === "HOME_TEAM"
                  ? "text-white"
                  : "text-gray-300"
              }`}
            >
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>
          {(isFinished || isLive) && (
            <span
              className={`text-lg font-bold ${
                match.score.winner === "HOME_TEAM"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            >
              {match.score.fullTime.home ?? "-"}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.awayTeam.crest && (
              <img
                src={match.awayTeam.crest}
                alt=""
                className="w-5 h-5 object-contain"
              />
            )}
            <span
              className={`text-sm font-medium ${
                isFinished && match.score.winner === "AWAY_TEAM"
                  ? "text-white"
                  : "text-gray-300"
              }`}
            >
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
          {(isFinished || isLive) && (
            <span
              className={`text-lg font-bold ${
                match.score.winner === "AWAY_TEAM"
                  ? "text-white"
                  : "text-gray-500"
              }`}
            >
              {match.score.fullTime.away ?? "-"}
            </span>
          )}
        </div>
      </div>

      {/* Booking info */}
      {!compact && bookingCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-2">
          <span className="text-yellow-400 text-xs">🟨 {bookingCount} cards</span>
          {match.referees?.[0] && (
            <span className="text-gray-500 text-xs">
              • Ref: {match.referees[0].name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
