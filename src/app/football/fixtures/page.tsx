"use client";

import { useState, useEffect, useCallback } from "react";
import type { MatchData, FixtureData, LeagueCode } from "@/lib/football-types";
import LeagueSelector from "@/components/football/LeagueSelector";
import MatchCard from "@/components/football/MatchCard";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

type ViewMode = "results" | "upcoming";

export default function FixturesPage() {
  const [competition, setCompetition] = useState<LeagueCode>("E0");
  const [viewMode, setViewMode] = useState<ViewMode>("results");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === "results") {
        const res = await fetch(
          `/api/football/matches?competition=${competition}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMatches(data.matches || []);
      } else {
        const res = await fetch(
          `/api/football/fixtures?competition=${competition}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFixtures(data.fixtures || []);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [competition, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group matches by date
  const grouped = viewMode === "results"
    ? matches.reduce((acc, match) => {
        const key = match.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(match);
        return acc;
      }, {} as Record<string, MatchData[]>)
    : {};

  const groupedFixtures = viewMode === "upcoming"
    ? fixtures.reduce((acc, fix) => {
        const key = fix.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(fix);
        return acc;
      }, {} as Record<string, FixtureData[]>)
    : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Fixtures & Results</h1>
          <p className="text-gray-500 text-sm">
            Browse match results and upcoming fixtures
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
      ) : viewMode === "results" ? (
        Object.keys(grouped).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, dayMatches]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
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
            No results available for this league
          </div>
        )
      ) : Object.keys(groupedFixtures).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedFixtures).map(([date, dayFixtures]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
                {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {dayFixtures.map((fix) => (
                  <MatchCard key={fix.id} fixture={fix} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-12">
          No upcoming fixtures available
        </div>
      )}
    </div>
  );
}
