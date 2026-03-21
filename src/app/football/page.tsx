"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { MatchData, FixtureData } from "@/lib/football-types";
import { CSV_LEAGUES } from "@/lib/football-types";
import MatchCard from "@/components/football/MatchCard";
import StatCard from "@/components/football/StatCard";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

export default function FootballDashboard() {
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchesRes, fixturesRes] = await Promise.all([
        fetch("/api/football/matches?limit=20"),
        fetch("/api/football/fixtures"),
      ]);

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setRecentMatches(data.matches || []);
        setTotalMatches(data.total || 0);
      } else {
        throw new Error("Failed to load matches");
      }

      if (fixturesRes.ok) {
        const data = await fixturesRes.json();
        setFixtures((data.fixtures || []).slice(0, 10));
      }
    } catch {
      setError("Failed to load data. CSV sources may be temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Count unique leagues in data
  const leaguesWithData = new Set(recentMatches.map((m) => m.leagueCode)).size;
  const totalCards = recentMatches.reduce((s, m) => s + m.totalCards, 0);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 via-gray-900 to-gray-950 border border-emerald-500/20 p-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Football <span className="text-emerald-400">Analytics</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Standings, fixtures, and deep booking analytics across Europe&apos;s top
            leagues. Powered by CSV data from football-data.co.uk — no API key
            needed.
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              href="/football/bookings"
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-400 transition-colors"
            >
              Booking Analytics
            </Link>
            <Link
              href="/football/standings"
              className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              View Standings
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Matches Loaded"
          value={totalMatches}
          icon="⚽"
          color="emerald"
          sublabel="from CSV data"
        />
        <StatCard
          label="Cards (Recent 20)"
          value={totalCards}
          icon="🟨"
          color="yellow"
          sublabel="yellow + red"
        />
        <StatCard
          label="Leagues"
          value={CSV_LEAGUES.length}
          icon="🏆"
          color="blue"
          sublabel="European leagues"
        />
        <StatCard
          label="Data Active"
          value={leaguesWithData}
          icon="📡"
          color="gray"
          sublabel="leagues with data"
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent results */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📋 Latest Results
            </h2>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.slice(0, 10).map((match) => (
                  <MatchCard key={match.id} match={match} compact />
                ))}
                <Link
                  href="/football/fixtures"
                  className="block text-center text-sm text-emerald-400 hover:text-emerald-300 py-2"
                >
                  View all results →
                </Link>
              </div>
            ) : (
              <div className="text-gray-500 text-sm bg-gray-900/50 rounded-xl p-6 text-center">
                No results loaded yet
              </div>
            )}
          </div>

          {/* Upcoming fixtures */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📅 Upcoming Fixtures
            </h2>
            {fixtures.length > 0 ? (
              <div className="space-y-3">
                {fixtures.map((fix) => (
                  <MatchCard key={fix.id} fixture={fix} />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm bg-gray-900/50 rounded-xl p-6 text-center">
                No upcoming fixtures available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            href: "/football/bookings",
            title: "Booking Analytics",
            desc: "Referee strictness, team discipline, card distributions, and prediction factors",
            color: "from-yellow-500/10 to-red-500/10 border-yellow-500/20",
            icon: "🟨",
          },
          {
            href: "/football/standings",
            title: "League Standings",
            desc: "Computed tables for all leagues from match results data",
            color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
            icon: "🏆",
          },
          {
            href: "/football/fixtures",
            title: "Fixtures & Results",
            desc: "Browse all matches and upcoming games across leagues",
            color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
            icon: "📅",
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`bg-gradient-to-br ${link.color} border rounded-xl p-5 hover:scale-[1.02] transition-transform`}
          >
            <div className="text-2xl mb-2">{link.icon}</div>
            <h3 className="font-semibold text-white mb-1">{link.title}</h3>
            <p className="text-sm text-gray-400">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* Data source info */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
        <strong className="text-gray-400">Data sources:</strong>{" "}
        <a href="https://www.football-data.co.uk" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">
          football-data.co.uk
        </a>{" "}
        (match CSVs) •{" "}
        <a href="https://github.com/datasets/football-datasets" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">
          GitHub football-datasets
        </a>{" "}
        (Premier League) •
        Player stats can be uploaded from{" "}
        <a href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">
          Kaggle
        </a>
      </div>
    </div>
  );
}
