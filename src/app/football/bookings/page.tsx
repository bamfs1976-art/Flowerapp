"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Match,
  CompetitionCode,
  BookingAnalytics,
  PlayerBookingProfile,
  RefereeProfile,
  TeamDiscipline,
} from "@/lib/football-types";
import { analyzeBookings } from "@/lib/booking-analytics";
import LeagueSelector from "@/components/football/LeagueSelector";
import StatCard from "@/components/football/StatCard";
import BarChart from "@/components/football/BarChart";
import HorizontalBar from "@/components/football/HorizontalBar";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

type Tab = "overview" | "players" | "referees" | "teams";

export default function BookingsPage() {
  const [competition, setCompetition] = useState<CompetitionCode>("PL");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailProgress, setDetailProgress] = useState({ loaded: 0, total: 0 });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalytics(null);

    try {
      // Fetch all finished matches for the competition
      const res = await fetch(
        `/api/football/matches?competition=${competition}&status=FINISHED`
      );
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      const matches: Match[] = data.matches || [];

      if (matches.length === 0) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      // Fetch individual match details for booking data
      // The list endpoint doesn't include bookings - need detail endpoint
      setLoadingDetail(true);
      setDetailProgress({ loaded: 0, total: Math.min(matches.length, 50) });

      const matchesToFetch = matches.slice(0, 50); // Limit to 50 to avoid rate limits
      const detailedMatches: Match[] = [];

      // Fetch in batches of 8 with delay to respect rate limits
      const batchSize = 8;
      for (let i = 0; i < matchesToFetch.length; i += batchSize) {
        const batch = matchesToFetch.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (match) => {
            try {
              const detailRes = await fetch(
                `/api/football/match?id=${match.id}`
              );
              if (detailRes.ok) {
                return await detailRes.json();
              }
              return match; // fallback to list data
            } catch {
              return match;
            }
          })
        );
        detailedMatches.push(...batchResults);
        setDetailProgress({
          loaded: Math.min(i + batchSize, matchesToFetch.length),
          total: matchesToFetch.length,
        });

        // Rate limit delay between batches (except last)
        if (i + batchSize < matchesToFetch.length) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      setLoadingDetail(false);
      const result = analyzeBookings(detailedMatches);
      setAnalytics(result);
    } catch {
      setError("Failed to load booking data. Check your API key.");
    } finally {
      setLoading(false);
    }
  }, [competition]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "players", label: "Player Cards", icon: "👤" },
    { key: "referees", label: "Referee Strictness", icon: "👨‍⚖️" },
    { key: "teams", label: "Team Discipline", icon: "🏟️" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Booking <span className="text-yellow-400">Analytics</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Deep analysis of player cards, referee patterns, and team discipline
        </p>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-gray-800 text-white shadow"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || loadingDetail ? (
        <div className="space-y-6">
          {loadingDetail && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">
                  Loading match details for booking data...
                </span>
                <span className="text-sm text-emerald-400 font-medium">
                  {detailProgress.loaded}/{detailProgress.total}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      detailProgress.total > 0
                        ? (detailProgress.loaded / detailProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
          <LoadingSkeleton rows={8} />
        </div>
      ) : analytics ? (
        <>
          {activeTab === "overview" && <OverviewTab analytics={analytics} />}
          {activeTab === "players" && (
            <PlayersTab players={analytics.playerProfiles} />
          )}
          {activeTab === "referees" && (
            <RefereesTab referees={analytics.refereeProfiles} />
          )}
          {activeTab === "teams" && (
            <TeamsTab teams={analytics.teamDiscipline} />
          )}
        </>
      ) : (
        <div className="text-gray-500 text-center py-12">
          No booking data available for this competition
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({ analytics }: { analytics: BookingAnalytics }) {
  return (
    <div className="space-y-6">
      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Matches Analyzed"
          value={analytics.totalMatchesAnalyzed}
          icon="⚽"
          color="emerald"
        />
        <StatCard
          label="Total Bookings"
          value={analytics.totalBookings}
          icon="🟨"
          color="yellow"
        />
        <StatCard
          label="Avg Cards/Match"
          value={analytics.averageBookingsPerMatch}
          icon="📊"
          color="blue"
        />
        <StatCard
          label="Red Cards"
          value={analytics.playerProfiles.reduce(
            (sum, p) => sum + p.totalReds,
            0
          )}
          icon="🟥"
          color="red"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings by minute range */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Cards by Time Period
          </h3>
          <BarChart
            data={analytics.bookingsByMinuteRange.map((r) => ({
              label: r.range,
              value: r.count,
              color:
                r.range.includes("76") || r.range.includes("61")
                  ? "#ef4444"
                  : r.range.includes("46") || r.range.includes("31")
                  ? "#f59e0b"
                  : "#10b981",
            }))}
            height={180}
          />
          <p className="text-xs text-gray-600 mt-3">
            Cards tend to cluster in the second half as fatigue and desperation
            increase
          </p>
        </div>

        {/* Half comparison */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            First Half vs Second Half
          </h3>
          <div className="flex items-center gap-6 mt-8">
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-emerald-400">
                {analytics.bookingsByHalf.firstHalf}
              </div>
              <div className="text-sm text-gray-500 mt-1">1st Half</div>
              <div className="text-xs text-gray-600">
                {analytics.totalBookings > 0
                  ? `${Math.round(
                      (analytics.bookingsByHalf.firstHalf /
                        analytics.totalBookings) *
                        100
                    )}%`
                  : "0%"}
              </div>
            </div>
            <div className="text-gray-700 text-2xl font-light">vs</div>
            <div className="flex-1 text-center">
              <div className="text-4xl font-bold text-yellow-400">
                {analytics.bookingsByHalf.secondHalf}
              </div>
              <div className="text-sm text-gray-500 mt-1">2nd Half</div>
              <div className="text-xs text-gray-600">
                {analytics.totalBookings > 0
                  ? `${Math.round(
                      (analytics.bookingsByHalf.secondHalf /
                        analytics.totalBookings) *
                        100
                    )}%`
                  : "0%"}
              </div>
            </div>
          </div>

          {/* Visual split bar */}
          <div className="mt-6 h-4 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all"
              style={{
                width: `${
                  analytics.totalBookings > 0
                    ? (analytics.bookingsByHalf.firstHalf /
                        analytics.totalBookings) *
                      100
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{
                width: `${
                  analytics.totalBookings > 0
                    ? (analytics.bookingsByHalf.secondHalf /
                        analytics.totalBookings) *
                      100
                    : 50
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Top booked players & strictest refs preview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Most Booked Players
          </h3>
          <HorizontalBar
            items={analytics.playerProfiles.slice(0, 8).map((p) => ({
              label: p.playerName,
              value: p.totalCards,
              sublabel: `${p.totalYellows}🟨 ${p.totalReds > 0 ? `${p.totalReds}🟥` : ""}`,
              color: p.totalReds > 0 ? "#ef4444" : "#eab308",
            }))}
          />
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Strictest Referees
          </h3>
          <HorizontalBar
            items={analytics.refereeProfiles
              .filter((r) => r.matchesOfficiated >= 2)
              .slice(0, 8)
              .map((r) => ({
                label: r.refereeName,
                value: r.cardsPerMatch,
                sublabel: `${r.matchesOfficiated} matches`,
                color:
                  r.strictnessRating === "Very Strict"
                    ? "#ef4444"
                    : r.strictnessRating === "Strict"
                    ? "#f59e0b"
                    : r.strictnessRating === "Moderate"
                    ? "#3b82f6"
                    : "#10b981",
              }))}
          />
        </div>
      </div>
    </div>
  );
}

// ── Players Tab ──

function PlayersTab({ players }: { players: PlayerBookingProfile[] }) {
  const [sortBy, setSortBy] = useState<"totalCards" | "bookingRate" | "averageMinute">(
    "totalCards"
  );

  const sorted = [...players].sort((a, b) => {
    if (sortBy === "bookingRate") return b.bookingRate - a.bookingRate;
    if (sortBy === "averageMinute") return a.averageMinute - b.averageMinute;
    return b.totalCards - a.totalCards;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Player Booking Profiles</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="totalCards">Total Cards</option>
          <option value="bookingRate">Cards per Match</option>
          <option value="averageMinute">Earliest Average Minute</option>
        </select>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">🟨</th>
                <th className="px-4 py-3 text-center">🟥</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Rate</th>
                <th className="px-4 py-3 text-center">Avg Min</th>
                <th className="px-4 py-3 text-left">Card Timeline</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 30).map((player, i) => (
                <tr
                  key={player.playerId}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {player.playerName}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {player.teamName}
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-medium">
                    {player.totalYellows}
                  </td>
                  <td className="px-4 py-3 text-center text-red-400 font-medium">
                    {player.totalReds || "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {player.totalCards}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        player.bookingRate >= 1.5
                          ? "bg-red-500/20 text-red-400"
                          : player.bookingRate >= 1
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {player.bookingRate.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {player.averageMinute}&apos;
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {player.cardMinutes.map((min, j) => (
                        <span
                          key={j}
                          className="inline-block w-1.5 h-4 rounded-sm"
                          style={{
                            backgroundColor: `hsl(${
                              120 - (min / 90) * 120
                            }, 70%, 50%)`,
                            opacity: 0.7 + (min / 90) * 0.3,
                          }}
                          title={`${min}'`}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking likelihood factors */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-xl p-5">
        <h3 className="font-semibold text-yellow-400 mb-2">
          Booking Likelihood Factors
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>
            <div className="text-white font-medium mb-1">Position</div>
            Defensive midfielders and full-backs are statistically the most
            booked positions due to tactical fouling.
          </div>
          <div>
            <div className="text-white font-medium mb-1">Match Context</div>
            Derbies, relegation battles, and knockout games see 30-40% more
            cards than average fixtures.
          </div>
          <div>
            <div className="text-white font-medium mb-1">Timing</div>
            75% of red cards come in the second half. The 75-90 minute window
            is the highest-risk period for bookings.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Referees Tab ──

function RefereesTab({ referees }: { referees: RefereeProfile[] }) {
  const qualifiedRefs = referees.filter((r) => r.matchesOfficiated >= 1);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Referee Strictness Analysis</h2>

      {/* Strictness distribution */}
      <div className="grid grid-cols-4 gap-3">
        {(["Lenient", "Moderate", "Strict", "Very Strict"] as const).map(
          (rating) => {
            const count = qualifiedRefs.filter(
              (r) => r.strictnessRating === rating
            ).length;
            const colors = {
              Lenient: "emerald",
              Moderate: "blue",
              Strict: "yellow",
              "Very Strict": "red",
            } as const;
            return (
              <StatCard
                key={rating}
                label={rating}
                value={count}
                color={colors[rating]}
                sublabel="referees"
              />
            );
          }
        )}
      </div>

      {/* Referee cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qualifiedRefs.map((ref) => {
          const ratingColors = {
            Lenient: "border-emerald-500/30 bg-emerald-500/5",
            Moderate: "border-blue-500/30 bg-blue-500/5",
            Strict: "border-yellow-500/30 bg-yellow-500/5",
            "Very Strict": "border-red-500/30 bg-red-500/5",
          };
          const badgeColors = {
            Lenient: "bg-emerald-500/20 text-emerald-400",
            Moderate: "bg-blue-500/20 text-blue-400",
            Strict: "bg-yellow-500/20 text-yellow-400",
            "Very Strict": "bg-red-500/20 text-red-400",
          };

          return (
            <div
              key={ref.refereeId}
              className={`border rounded-xl p-4 ${ratingColors[ref.strictnessRating]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-white">
                    {ref.refereeName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ref.nationality}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    badgeColors[ref.strictnessRating]
                  }`}
                >
                  {ref.strictnessRating}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">
                    {ref.matchesOfficiated}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Matches
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-400">
                    {ref.totalYellows}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Yellows
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">
                    {ref.totalReds}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    Reds
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Cards/Match</span>
                  <span className="text-sm font-bold text-white">
                    {ref.cardsPerMatch}
                  </span>
                </div>
                {/* Visual indicator */}
                <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((ref.cardsPerMatch / 8) * 100, 100)}%`,
                      backgroundColor:
                        ref.cardsPerMatch > 6
                          ? "#ef4444"
                          : ref.cardsPerMatch > 4.5
                          ? "#f59e0b"
                          : ref.cardsPerMatch > 3
                          ? "#3b82f6"
                          : "#10b981",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {qualifiedRefs.length === 0 && (
        <div className="text-gray-500 text-center py-12">
          No referee data available. Referee data requires individual match
          details to be loaded.
        </div>
      )}
    </div>
  );
}

// ── Teams Tab ──

function TeamsTab({ teams }: { teams: TeamDiscipline[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team Discipline Rankings</h2>

      {/* Team discipline table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">Matches</th>
                <th className="px-4 py-3 text-center">🟨</th>
                <th className="px-4 py-3 text-center">🟥</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Per Match</th>
                <th className="px-4 py-3 text-left">Discipline Bar</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team.teamId}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {team.teamCrest && (
                        <img
                          src={team.teamCrest}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="font-medium text-white">
                        {team.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {team.matchesPlayed}
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-medium">
                    {team.totalYellows}
                  </td>
                  <td className="px-4 py-3 text-center text-red-400 font-medium">
                    {team.totalReds || "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {team.totalCards}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        team.cardsPerMatch >= 3
                          ? "bg-red-500/20 text-red-400"
                          : team.cardsPerMatch >= 2
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {team.cardsPerMatch}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            (team.cardsPerMatch / 4) * 100,
                            100
                          )}%`,
                          backgroundColor:
                            team.cardsPerMatch >= 3
                              ? "#ef4444"
                              : team.cardsPerMatch >= 2
                              ? "#f59e0b"
                              : "#10b981",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most booked players per team */}
      {teams.slice(0, 6).map(
        (team) =>
          team.mostBookedPlayers.length > 0 && (
            <div
              key={team.teamId}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                {team.teamCrest && (
                  <img
                    src={team.teamCrest}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                )}
                <h3 className="text-sm font-semibold text-white">
                  {team.teamName} — Most Booked Players
                </h3>
              </div>
              <HorizontalBar
                items={team.mostBookedPlayers.map((p) => ({
                  label: p.playerName,
                  value: p.totalCards,
                  sublabel: `${p.totalYellows}🟨 ${p.totalReds > 0 ? `${p.totalReds}🟥` : ""}`,
                  color: p.totalReds > 0 ? "#ef4444" : "#eab308",
                }))}
              />
            </div>
          )
      )}
    </div>
  );
}
