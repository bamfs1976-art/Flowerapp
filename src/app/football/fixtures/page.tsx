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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight mb-0.5 sm:mb-1">Fixtures & Results</h1>
          <p className="text-white/35 text-[12px] sm:text-[13px]">
            Browse match results and upcoming fixtures
          </p>
        </div>

        {/* Segmented control */}
        <div className="flex bg-white/[0.04] rounded-xl p-1">
          <button
            onClick={() => setViewMode("results")}
            className={`px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              viewMode === "results"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-white/40 active:text-white/70"
            }`}
          >
            Results
          </button>
          <button
            onClick={() => setViewMode("upcoming")}
            className={`px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              viewMode === "upcoming"
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-white/40 active:text-white/70"
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} />

      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 text-red-400 text-[13px]">
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
                <h3 className="text-[11px] font-semibold text-white/25 mb-3 uppercase tracking-widest">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {dayMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/30 text-center py-16 text-[13px]">
            No results available for this league
          </div>
        )
      ) : Object.keys(groupedFixtures).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedFixtures).map(([date, dayFixtures]) => (
            <div key={date}>
              <h3 className="text-[11px] font-semibold text-white/25 mb-3 uppercase tracking-widest">
                {new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {dayFixtures.map((fix) => (
                  <MatchCard key={fix.id} fixture={fix} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/30 text-center py-16 text-[13px]">
          No upcoming fixtures available
        </div>
      )}
    </div>
  );
}
