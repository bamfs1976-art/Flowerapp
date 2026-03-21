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

  const leaguesWithData = new Set(recentMatches.map((m) => m.leagueCode)).size;
  const totalCards = recentMatches.reduce((s, m) => s + m.totalCards, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.06] p-5 sm:p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-blue-500/[0.04]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.06] rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h1 className="text-[26px] sm:text-[32px] md:text-[38px] font-bold tracking-tight leading-tight mb-2 sm:mb-3">
            Football <span className="text-emerald-400">Analytics</span>
          </h1>
          <p className="text-white/40 max-w-lg text-[13px] sm:text-[15px] leading-relaxed">
            Standings, fixtures, and deep booking analytics across Europe&apos;s top
            leagues. Powered by CSV data — no API key needed.
          </p>
          <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-7">
            <Link
              href="/football/bookings"
              className="px-4 sm:px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[13px] sm:text-[14px] font-semibold active:bg-emerald-600 hover:bg-emerald-400 transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              Booking Predictions
            </Link>
            <Link
              href="/football/standings"
              className="px-4 sm:px-5 py-2.5 bg-white/[0.06] text-white/70 rounded-xl text-[13px] sm:text-[14px] font-semibold active:bg-white/[0.12] hover:bg-white/[0.1] hover:text-white transition-all duration-200"
            >
              View Standings
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 stagger-children">
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
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent results */}
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-semibold mb-3 sm:mb-4 text-white/80 tracking-tight">
              Latest Results
            </h2>
            {recentMatches.length > 0 ? (
              <div className="space-y-2">
                {recentMatches.slice(0, 10).map((match) => (
                  <MatchCard key={match.id} match={match} compact />
                ))}
                <Link
                  href="/football/fixtures"
                  className="block text-center text-[13px] text-emerald-400/80 hover:text-emerald-400 py-3 transition-colors duration-200"
                >
                  View all results
                </Link>
              </div>
            ) : (
              <div className="text-white/30 text-[13px] glass-card rounded-2xl p-8 text-center">
                No results loaded yet
              </div>
            )}
          </div>

          {/* Upcoming fixtures */}
          <div>
            <h2 className="text-[15px] font-semibold mb-4 text-white/80 tracking-tight">
              Upcoming Fixtures
            </h2>
            {fixtures.length > 0 ? (
              <div className="space-y-2">
                {fixtures.map((fix) => (
                  <MatchCard key={fix.id} fixture={fix} />
                ))}
              </div>
            ) : (
              <div className="text-white/30 text-[13px] glass-card rounded-2xl p-8 text-center">
                No upcoming fixtures available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-children">
        {[
          {
            href: "/football/bookings",
            title: "Booking Analytics",
            desc: "Referee strictness, team discipline, card predictions",
            gradient: "from-yellow-500/[0.06] to-red-500/[0.04]",
            border: "border-yellow-500/[0.1]",
            icon: "🟨",
          },
          {
            href: "/football/standings",
            title: "League Standings",
            desc: "Computed tables from match results",
            gradient: "from-blue-500/[0.06] to-indigo-500/[0.04]",
            border: "border-blue-500/[0.1]",
            icon: "🏆",
          },
          {
            href: "/football/fixtures",
            title: "Fixtures & Results",
            desc: "Browse matches across all leagues",
            gradient: "from-emerald-500/[0.06] to-teal-500/[0.04]",
            border: "border-emerald-500/[0.1]",
            icon: "📅",
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`bg-gradient-to-br ${link.gradient} ${link.border} border rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 group`}
          >
            <div className="text-2xl mb-3 transition-transform duration-200 group-hover:scale-110 inline-block">{link.icon}</div>
            <h3 className="font-semibold text-white/90 mb-1 text-[15px]">{link.title}</h3>
            <p className="text-[13px] text-white/35 leading-relaxed">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
