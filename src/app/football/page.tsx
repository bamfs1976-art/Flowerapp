"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Match } from "@/lib/football-types";
import { FREE_COMPETITIONS, type CompetitionCode } from "@/lib/football-types";
import MatchCard from "@/components/football/MatchCard";
import StatCard from "@/components/football/StatCard";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

export default function FootballDashboard() {
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, recentRes] = await Promise.all([
        fetch("/api/football/today"),
        fetch("/api/football/matches?competition=PL&status=FINISHED"),
      ]);

      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayMatches(todayData.matches || []);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentMatches(
          (recentData.matches || [])
            .sort(
              (a: Match, b: Match) =>
                new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()
            )
            .slice(0, 10)
        );
      }
    } catch {
      setError("Failed to load data. Check your API key configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const liveMatches = todayMatches.filter(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );
  const scheduledToday = todayMatches.filter(
    (m) => m.status === "SCHEDULED" || m.status === "TIMED"
  );
  const finishedToday = todayMatches.filter((m) => m.status === "FINISHED");

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 via-gray-900 to-gray-950 border border-emerald-500/20 p-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Football <span className="text-emerald-400">Analytics</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Real-time standings, fixtures, and deep booking analytics across
            Europe&apos;s top leagues. Track referee strictness, player discipline,
            and card prediction insights.
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
          <div className="text-xs mt-1 text-red-500/70">
            Ensure FOOTBALL_DATA_API_KEY is set in your .env file. Get a free key at{" "}
            <a href="https://www.football-data.org" className="underline" target="_blank" rel="noopener noreferrer">
              football-data.org
            </a>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Live Now"
          value={liveMatches.length}
          icon="🔴"
          color="red"
          sublabel="matches in play"
        />
        <StatCard
          label="Today&apos;s Fixtures"
          value={scheduledToday.length + finishedToday.length + liveMatches.length}
          icon="📅"
          color="blue"
          sublabel="across all leagues"
        />
        <StatCard
          label="Leagues Covered"
          value={FREE_COMPETITIONS.length}
          icon="🏆"
          color="emerald"
          sublabel="European leagues"
        />
        <StatCard
          label="Finished Today"
          value={finishedToday.length}
          icon="✅"
          color="gray"
          sublabel="completed matches"
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Today's matches */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-red-400">●</span> Today&apos;s Matches
            </h2>
            {todayMatches.length > 0 ? (
              <div className="space-y-3">
                {todayMatches.slice(0, 8).map((match) => (
                  <MatchCard key={match.id} match={match} compact />
                ))}
                {todayMatches.length > 8 && (
                  <Link
                    href="/football/fixtures"
                    className="block text-center text-sm text-emerald-400 hover:text-emerald-300 py-2"
                  >
                    View all {todayMatches.length} matches →
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm bg-gray-900/50 rounded-xl p-6 text-center">
                No matches scheduled for today
              </div>
            )}
          </div>

          {/* Recent results */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📋</span> Recent Premier League Results
            </h2>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} compact />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm bg-gray-900/50 rounded-xl p-6 text-center">
                No recent results available
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
            desc: "Player cards, referee strictness, team discipline rankings",
            color: "from-yellow-500/10 to-red-500/10 border-yellow-500/20",
            icon: "🟨",
          },
          {
            href: "/football/standings",
            title: "League Standings",
            desc: "Live tables for all major European leagues",
            color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
            icon: "🏆",
          },
          {
            href: "/football/fixtures",
            title: "Fixtures & Results",
            desc: "Upcoming games and recent results with scores",
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
    </div>
  );
}
