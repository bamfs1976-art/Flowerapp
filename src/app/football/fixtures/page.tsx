"use client";

import { useState, useEffect, useCallback } from "react";
import type { Match, CompetitionCode } from "@/lib/football-types";
import LeagueSelector from "@/components/football/LeagueSelector";
import MatchCard from "@/components/football/MatchCard";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

type ViewMode = "upcoming" | "results";

export default function FixturesPage() {
  const [competition, setCompetition] = useState<CompetitionCode>("PL");
  const [viewMode, setViewMode] = useState<ViewMode>("results");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = viewMode === "upcoming" ? "SCHEDULED" : "FINISHED";
      const res = await fetch(
        `/api/football/matches?competition=${competition}&status=${status}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const sorted = (data.matches || []).sort((a: Match, b: Match) => {
        if (viewMode === "results") {
          return new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime();
        }
        return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
      });
      setMatches(sorted);
    } catch {
      setError("Failed to load fixtures");
    } finally {
      setLoading(false);
    }
  }, [competition, viewMode]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Group matches by matchday
  const groupedByMatchday = matches.reduce(
    (acc, match) => {
      const key = `Matchday ${match.matchday || "?"}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    },
    {} as Record<string, Match[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Fixtures & Results</h1>
          <p className="text-gray-500 text-sm">
            Browse upcoming fixtures and recent results
          </p>
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("results")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "results"
                ? "bg-emerald-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setViewMode("upcoming")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "upcoming"
                ? "bg-emerald-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : matches.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByMatchday).map(([matchday, dayMatches]) => (
            <div key={matchday}>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                {matchday}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {dayMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-12">
          No {viewMode === "upcoming" ? "upcoming fixtures" : "results"}{" "}
          available
        </div>
      )}
    </div>
  );
}
