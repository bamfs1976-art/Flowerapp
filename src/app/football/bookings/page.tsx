"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  LeagueCode,
  BookingAnalytics,
  RefereeStats,
  TeamDiscipline,
  PlayerStats,
  MatchData,
  MatchPrediction,
  PlayerBookingRisk,
} from "@/lib/football-types";
import LeagueSelector from "@/components/football/LeagueSelector";
import StatCard from "@/components/football/StatCard";
import BarChart from "@/components/football/BarChart";
import HorizontalBar from "@/components/football/HorizontalBar";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

type Tab = "predictions" | "overview" | "referees" | "teams" | "players" | "matches";

export default function BookingsPage() {
  const [competition, setCompetition] = useState<string>("E0");
  const [activeTab, setActiveTab] = useState<Tab>("predictions");
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = competition
        ? `/api/football/bookings?competition=${competition}`
        : "/api/football/bookings";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: BookingAnalytics = await res.json();
      setAnalytics(data);
    } catch {
      setError("Failed to load booking analytics");
    } finally {
      setLoading(false);
    }
  }, [competition]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "predictions", label: "Predictions", icon: "🔮" },
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "referees", label: "Referee Strictness", icon: "👨‍⚖️" },
    { key: "teams", label: "Team Discipline", icon: "🏟️" },
    { key: "players", label: "Player Cards", icon: "👤" },
    { key: "matches", label: "High-Card Matches", icon: "🔥" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight mb-1">
          Booking <span className="text-yellow-400">Analytics</span>
        </h1>
        <p className="text-white/35 text-[13px]">
          Referee strictness, team discipline, card patterns — from CSV match data
        </p>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} showAll />

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white/[0.04] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : analytics && analytics.totalMatchesAnalyzed > 0 ? (
        <>
          {activeTab === "predictions" && <PredictionsTab competition={competition} />}
          {activeTab === "overview" && <OverviewTab analytics={analytics} />}
          {activeTab === "referees" && <RefereesTab referees={analytics.refereeStats} />}
          {activeTab === "teams" && <TeamsTab teams={analytics.teamDiscipline} avgCards={analytics.averageCardsPerMatch} />}
          {activeTab === "players" && <PlayersTab players={analytics.playerStats} />}
          {activeTab === "matches" && <HighCardMatchesTab matches={analytics.highCardMatches} />}
        </>
      ) : (
        <div className="text-white/30 text-center py-16 text-[13px]">
          No booking data available. CSV data may still be loading.
        </div>
      )}
    </div>
  );
}

// ── Predictions Tab ──

function PredictionsTab({ competition }: { competition: string }) {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [meta, setMeta] = useState<{
    fixtureCount: number;
    matchesAnalyzed: number;
    hasPlayerData: boolean;
    hasRefereeAssignments: boolean;
    leagueAvgCards: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = competition
      ? `/api/football/predictions?competition=${competition}`
      : "/api/football/predictions";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setPredictions(data.predictions || []);
        setMeta(data.meta || null);
      })
      .catch(() => setError("Failed to load predictions"))
      .finally(() => setLoading(false));
  }, [competition]);

  if (loading) return <LoadingSkeleton rows={6} />;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-gray-500 text-center py-12">
        <div className="text-3xl mb-3">🔮</div>
        <p>No upcoming fixtures found for predictions.</p>
        <p className="text-xs mt-1">Fixture data may not yet be available from football-data.co.uk</p>
      </div>
    );
  }

  const riskColors = {
    Low: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-400" },
    Medium: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
    High: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400" },
    "Very High": { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500/20 text-red-400" },
  };

  const confidenceColors = {
    Low: "text-gray-500",
    Medium: "text-yellow-400",
    High: "text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">Booking Predictions</h2>
          <p className="text-gray-500 text-sm">
            Upcoming fixtures ranked by expected card volume
          </p>
        </div>
        {meta && (
          <div className="flex gap-3 flex-wrap text-[11px] text-white/30">
            <span>{meta.fixtureCount} fixtures</span>
            <span>{meta.matchesAnalyzed} matches analyzed</span>
            <span>Avg: {meta.leagueAvgCards} cards/match</span>
            {meta.hasRefereeAssignments && (
              <span className="text-purple-400">Referee intel active</span>
            )}
            {!meta.hasPlayerData && (
              <span className="text-yellow-400/60">Upload player CSV for player-level risks</span>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Very High Risk"
          value={predictions.filter((p) => p.riskRating === "Very High").length}
          icon="🔴"
          color="red"
          sublabel="6+ cards expected"
        />
        <StatCard
          label="High Risk"
          value={predictions.filter((p) => p.riskRating === "High").length}
          icon="🟡"
          color="yellow"
          sublabel="4.5-6 cards expected"
        />
        <StatCard
          label="Medium Risk"
          value={predictions.filter((p) => p.riskRating === "Medium").length}
          icon="🔵"
          color="blue"
          sublabel="3-4.5 cards expected"
        />
        <StatCard
          label="Highest Predicted"
          value={predictions[0]?.expectedCards || 0}
          icon="🔮"
          color="red"
          sublabel={predictions[0] ? `${predictions[0].fixture.homeTeam} v ${predictions[0].fixture.awayTeam}` : ""}
        />
      </div>

      {/* Prediction cards */}
      <div className="space-y-3">
        {predictions.map((pred) => {
          const colors = riskColors[pred.riskRating];
          const isExpanded = expandedMatch === pred.fixture.id;

          return (
            <div
              key={pred.fixture.id}
              className={`border rounded-xl overflow-hidden transition-all ${colors.border} ${colors.bg}`}
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedMatch(isExpanded ? null : pred.fixture.id)}
                className="w-full px-4 py-4 flex items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-bold text-white">{pred.expectedCards}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Cards</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {pred.fixture.homeTeam} vs {pred.fixture.awayTeam}
                    </div>
                    <div className="text-[11px] text-white/30 flex items-center gap-1.5 flex-wrap">
                      <span>{pred.fixture.date} {pred.fixture.time && `\u00b7 ${pred.fixture.time}`} \u00b7 {pred.fixture.league}</span>
                      {pred.confirmedReferee && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/[0.12] text-purple-400 text-[10px] font-semibold">
                          <span className="opacity-70">REF</span> {pred.confirmedReferee.name}
                          {pred.confirmedReferee.strictnessRating && (
                            <span className={`ml-0.5 ${
                              pred.confirmedReferee.strictnessRating === "Very Strict" ? "text-red-400" :
                              pred.confirmedReferee.strictnessRating === "Strict" ? "text-yellow-400" :
                              pred.confirmedReferee.strictnessRating === "Moderate" ? "text-blue-400" :
                              "text-emerald-400"
                            }`}>
                              ({pred.confirmedReferee.strictnessRating})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Card range */}
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {pred.cardRange.low}-{pred.cardRange.high} range
                  </span>
                  {/* Risk badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                    {pred.riskRating}
                  </span>
                  {/* Confidence */}
                  <span className={`text-xs ${confidenceColors[pred.confidence]}`}>
                    {pred.confidence}
                  </span>
                  {/* Expand arrow */}
                  <span className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
                  {/* Confirmed referee profile */}
                  {pred.confirmedReferee && pred.confirmedReferee.cardsPerMatch && (
                    <div className="glass-card rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-sm">👨‍⚖️</span>
                        <h4 className="text-[12px] uppercase text-purple-400 font-semibold tracking-wide">
                          Confirmed Referee
                        </h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-semibold text-white/90">{pred.confirmedReferee.name}</div>
                          <div className="text-[11px] text-white/30 mt-0.5">
                            {pred.confirmedReferee.totalMatches} matches this season
                            {pred.confirmedReferee.matchweek && ` \u00b7 MW${pred.confirmedReferee.matchweek}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-400">{pred.confirmedReferee.cardsPerMatch}</div>
                            <div className="text-[9px] text-white/25 uppercase tracking-wider">Cards/Match</div>
                          </div>
                          {pred.confirmedReferee.strictnessRating && (
                            <span className={`text-[11px] px-2 py-1 rounded-lg font-semibold ${
                              pred.confirmedReferee.strictnessRating === "Very Strict"
                                ? "bg-red-500/[0.12] text-red-400"
                                : pred.confirmedReferee.strictnessRating === "Strict"
                                ? "bg-yellow-500/[0.12] text-yellow-400"
                                : pred.confirmedReferee.strictnessRating === "Moderate"
                                ? "bg-blue-500/[0.12] text-blue-400"
                                : "bg-emerald-500/[0.12] text-emerald-400"
                            }`}>
                              {pred.confirmedReferee.strictnessRating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prediction factors */}
                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Prediction Factors</h4>
                    <div className="space-y-1.5">
                      {pred.factors.map((factor, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`flex-shrink-0 w-5 text-center ${
                            factor.impact === "increases" ? "text-red-400" :
                            factor.impact === "decreases" ? "text-emerald-400" :
                            "text-gray-500"
                          }`}>
                            {factor.impact === "increases" ? "▲" : factor.impact === "decreases" ? "▼" : "–"}
                          </span>
                          <span className="text-gray-300">{factor.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Head-to-head */}
                  {pred.headToHead && (
                    <div>
                      <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Head-to-Head Record</h4>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{pred.headToHead.matches}</div>
                          <div className="text-[10px] text-gray-500 uppercase">Meetings</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-400">{pred.headToHead.avgCards}</div>
                          <div className="text-[10px] text-gray-500 uppercase">Avg Cards</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-400">{pred.headToHead.highestCards}</div>
                          <div className="text-[10px] text-gray-500 uppercase">Max Cards</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-400">
                            {pred.headToHead.avgHomeFouls + pred.headToHead.avgAwayFouls}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Avg Fouls</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Player risks */}
                  {pred.playerRisks.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">
                        Players Most Likely to Be Booked
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {pred.playerRisks.slice(0, 6).map((player) => (
                          <PlayerRiskCard key={`${player.player}-${player.squad}`} player={player} />
                        ))}
                      </div>
                    </div>
                  )}

                  {pred.playerRisks.length === 0 && (
                    <div className="text-xs text-gray-500 italic">
                      Upload a player stats CSV in the Player Cards tab to see individual booking risk predictions
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Methodology note */}
      <div className="glass-card rounded-2xl p-4 text-[11px] text-white/30">
        <span className="font-semibold text-white/40">How predictions work: </span>
        Predictions combine team discipline profiles (home/away card rates), confirmed referee
        strictness data, head-to-head history, seasonal card trends, and combined foul rates.
        Referee assignments are sourced from official PL match officials announcements — when a
        strict referee is confirmed, predicted card counts adjust accordingly. Player-level risks
        factor in individual card frequency, position risk, and minutes-per-card efficiency.
      </div>
    </div>
  );
}

function PlayerRiskCard({ player }: { player: PlayerBookingRisk }) {
  const riskColors = {
    Low: "border-gray-700 bg-gray-800/50",
    Medium: "border-blue-500/30 bg-blue-500/5",
    High: "border-yellow-500/30 bg-yellow-500/5",
    "Very High": "border-red-500/30 bg-red-500/5",
  };
  const riskBadge = {
    Low: "bg-gray-700 text-gray-400",
    Medium: "bg-blue-500/20 text-blue-400",
    High: "bg-yellow-500/20 text-yellow-400",
    "Very High": "bg-red-500/20 text-red-400",
  };

  return (
    <div className={`border rounded-lg p-3 ${riskColors[player.riskLevel]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{player.player}</div>
          <div className="text-[10px] text-gray-500">{player.squad} • {player.position}</div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${riskBadge[player.riskLevel]}`}>
          {player.riskScore}%
        </span>
      </div>
      {/* Risk bar */}
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${player.riskScore}%`,
            backgroundColor:
              player.riskScore >= 70 ? "#ef4444" :
              player.riskScore >= 50 ? "#f59e0b" :
              player.riskScore >= 30 ? "#3b82f6" : "#6b7280",
          }}
        />
      </div>
      <div className="flex gap-3 text-[10px] text-gray-500">
        <span>{player.cardsPerNinety} cards/90</span>
        <span>{player.totalCards} total</span>
        <span>{player.matchesPlayed} MP</span>
      </div>
      {player.reasons.length > 0 && (
        <div className="mt-1.5 text-[10px] text-gray-400">
          {player.reasons[0]}
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
          label="Total Yellow Cards"
          value={analytics.totalYellowCards}
          icon="🟨"
          color="yellow"
        />
        <StatCard
          label="Total Red Cards"
          value={analytics.totalRedCards}
          icon="🟥"
          color="red"
        />
        <StatCard
          label="Avg Cards/Match"
          value={analytics.averageCardsPerMatch}
          icon="📊"
          color="blue"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Avg Fouls/Match"
          value={analytics.averageFoulsPerMatch}
          icon="⚡"
          color="gray"
          sublabel="across all matches"
        />
        <StatCard
          label="Fouls per Card"
          value={analytics.averageFoulsPerCard}
          icon="📐"
          color="emerald"
          sublabel="fouls needed for a card"
        />
        <StatCard
          label="Referees Tracked"
          value={analytics.refereeStats.length}
          icon="👨‍⚖️"
          color="blue"
          sublabel="unique match officials"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card distribution */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Card Distribution (per match)
          </h3>
          <BarChart
            data={analytics.cardDistribution.map((d) => ({
              label: `${d.range} cards`,
              value: d.total,
              color: d.range === "10+" ? "#ef4444" : d.range === "8-9" ? "#f59e0b" : "#10b981",
            }))}
            height={180}
          />
          <p className="text-xs text-gray-600 mt-3">
            Number of matches in each total-cards bracket
          </p>
        </div>

        {/* Home vs Away */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Home vs Away Cards
          </h3>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {analytics.homeVsAway.homeYellows}
              </div>
              <div className="text-sm text-gray-500 mt-1">Home 🟨</div>
              <div className="text-xl font-bold text-red-400 mt-2">
                {analytics.homeVsAway.homeReds}
              </div>
              <div className="text-sm text-gray-500">Home 🟥</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {analytics.homeVsAway.awayYellows}
              </div>
              <div className="text-sm text-gray-500 mt-1">Away 🟨</div>
              <div className="text-xl font-bold text-red-400 mt-2">
                {analytics.homeVsAway.awayReds}
              </div>
              <div className="text-sm text-gray-500">Away 🟥</div>
            </div>
          </div>

          {/* Split bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Home yellows</span>
              <span>Away yellows</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 transition-all"
                style={{
                  width: `${
                    (analytics.homeVsAway.homeYellows /
                      Math.max(analytics.homeVsAway.homeYellows + analytics.homeVsAway.awayYellows, 1)) *
                    100
                  }%`,
                }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{
                  width: `${
                    (analytics.homeVsAway.awayYellows /
                      Math.max(analytics.homeVsAway.homeYellows + analytics.homeVsAway.awayYellows, 1)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cards by match result + monthly trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Avg Cards by Match Result
          </h3>
          <BarChart
            data={[
              { label: "Home Win", value: analytics.cardsByMatchResult.homeWin, color: "#3b82f6" },
              { label: "Draw", value: analytics.cardsByMatchResult.draw, color: "#6b7280" },
              { label: "Away Win", value: analytics.cardsByMatchResult.awayWin, color: "#f59e0b" },
            ]}
            height={160}
          />
          <p className="text-xs text-gray-600 mt-3">
            Average cards per match grouped by final result
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Monthly Card Trends
          </h3>
          {analytics.monthlyTrends.length > 0 ? (
            <BarChart
              data={analytics.monthlyTrends.map((t) => ({
                label: t.month.slice(5), // MM
                value: t.avgCards,
                color: t.avgCards > analytics.averageCardsPerMatch ? "#ef4444" : "#10b981",
              }))}
              height={160}
            />
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              Insufficient data for trends
            </div>
          )}
        </div>
      </div>

      {/* Quick previews */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Strictest Referees (top 8)
          </h3>
          <HorizontalBar
            items={analytics.refereeStats
              .filter((r) => r.matchesOfficiated >= 2)
              .slice(0, 8)
              .map((r) => ({
                label: r.name,
                value: r.cardsPerMatch,
                sublabel: `${r.matchesOfficiated} matches`,
                color:
                  r.strictnessRating === "Very Strict" ? "#ef4444" :
                  r.strictnessRating === "Strict" ? "#f59e0b" :
                  r.strictnessRating === "Moderate" ? "#3b82f6" : "#10b981",
              }))}
          />
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-[13px] font-semibold text-white/60 mb-4">
            Least Disciplined Teams (top 8)
          </h3>
          <HorizontalBar
            items={analytics.teamDiscipline
              .filter((t) => t.matchesPlayed >= 3)
              .slice(0, 8)
              .map((t) => ({
                label: t.team,
                value: t.cardsPerMatch,
                sublabel: `${t.totalCards} total`,
                color: t.cardsPerMatch >= 2.5 ? "#ef4444" : t.cardsPerMatch >= 1.5 ? "#f59e0b" : "#10b981",
              }))}
          />
        </div>
      </div>

      {/* Insights panel */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-xl p-5">
        <h3 className="font-semibold text-yellow-400 mb-3">
          Booking Likelihood Factors
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>
            <div className="text-white font-medium mb-1">Referee Impact</div>
            The strictest referees average {analytics.refereeStats[0]?.cardsPerMatch || "N/A"} cards/match
            — the most lenient average {analytics.refereeStats[analytics.refereeStats.length - 1]?.cardsPerMatch || "N/A"}.
            The referee is the single biggest predictive factor for card volume.
          </div>
          <div>
            <div className="text-white font-medium mb-1">Home vs Away</div>
            Away teams receive {analytics.homeVsAway.awayYellows > analytics.homeVsAway.homeYellows ? "more" : "fewer"} yellows
            ({analytics.homeVsAway.awayYellows} vs {analytics.homeVsAway.homeYellows}),
            consistent with the away-team discipline penalty seen across leagues.
          </div>
          <div>
            <div className="text-white font-medium mb-1">Match Context</div>
            Draws average {analytics.cardsByMatchResult.draw} cards/match vs {analytics.cardsByMatchResult.homeWin} in
            home wins — tight, contested matches generate more cards as teams fight for every ball.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Referees Tab ──

function RefereesTab({ referees }: { referees: RefereeStats[] }) {
  const qualified = referees.filter((r) => r.matchesOfficiated >= 1);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Referee Strictness Analysis</h2>

      {/* Strictness distribution */}
      <div className="grid grid-cols-4 gap-3">
        {(["Lenient", "Moderate", "Strict", "Very Strict"] as const).map((rating) => {
          const count = qualified.filter((r) => r.strictnessRating === rating).length;
          const colors = {
            Lenient: "emerald", Moderate: "blue", Strict: "yellow", "Very Strict": "red",
          } as const;
          return (
            <StatCard key={rating} label={rating} value={count} color={colors[rating]} sublabel="referees" />
          );
        })}
      </div>

      {/* Referee cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qualified.map((ref) => {
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
            <div key={ref.name} className={`border rounded-xl p-4 ${ratingColors[ref.strictnessRating]}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-white">{ref.name}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColors[ref.strictnessRating]}`}>
                  {ref.strictnessRating}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{ref.matchesOfficiated}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Matches</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-400">{ref.totalYellows}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Yellows</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">{ref.totalReds}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Reds</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">{ref.foulsPerMatch}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Fouls/M</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Cards/Match</span>
                  <span className="text-sm font-bold text-white">{ref.cardsPerMatch}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((ref.cardsPerMatch / 8) * 100, 100)}%`,
                      backgroundColor:
                        ref.cardsPerMatch > 6 ? "#ef4444" :
                        ref.cardsPerMatch > 4.5 ? "#f59e0b" :
                        ref.cardsPerMatch > 3 ? "#3b82f6" : "#10b981",
                    }}
                  />
                </div>

                {/* Home/away bias */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Home card rate: {Math.round(ref.homeYellowRate * 100)}%</span>
                  <span>Away card rate: {Math.round(ref.awayYellowRate * 100)}%</span>
                </div>
              </div>

              {/* Recent form sparkline */}
              {ref.recentForm.length > 0 && (
                <div className="mt-2 flex gap-0.5 items-end h-6">
                  {ref.recentForm.map((cards, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.min((cards / 10) * 100, 100)}%`,
                        backgroundColor: cards > 6 ? "#ef4444" : cards > 4 ? "#f59e0b" : "#10b981",
                        minHeight: 2,
                      }}
                      title={`${cards} cards`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {qualified.length === 0 && (
        <div className="text-gray-500 text-center py-12">No referee data available</div>
      )}
    </div>
  );
}

// ── Teams Tab ──

function TeamsTab({ teams, avgCards }: { teams: TeamDiscipline[]; avgCards: number }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team Discipline Rankings</h2>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">🟨</th>
                <th className="px-4 py-3 text-center">🟥</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Cards/M</th>
                <th className="px-4 py-3 text-center">Fouls/M</th>
                <th className="px-4 py-3 text-center">Fouls/Card</th>
                <th className="px-4 py-3 text-center">Home</th>
                <th className="px-4 py-3 text-center">Away</th>
                <th className="px-4 py-3 text-left w-32">Discipline</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team.team}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-white">{team.team}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{team.matchesPlayed}</td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-medium">{team.totalYellows}</td>
                  <td className="px-4 py-3 text-center text-red-400 font-medium">{team.totalReds || "-"}</td>
                  <td className="px-4 py-3 text-center font-bold text-white">{team.totalCards}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      team.cardsPerMatch >= avgCards * 1.2 ? "bg-red-500/20 text-red-400" :
                      team.cardsPerMatch >= avgCards * 0.8 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {team.cardsPerMatch}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{team.foulsPerMatch}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{team.foulsPerCard}</td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{team.homeCardRate}/m</td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{team.awayCardRate}/m</td>
                  <td className="px-4 py-3">
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((team.cardsPerMatch / 4) * 100, 100)}%`,
                          backgroundColor:
                            team.cardsPerMatch >= 3 ? "#ef4444" :
                            team.cardsPerMatch >= 2 ? "#f59e0b" : "#10b981",
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
    </div>
  );
}

// ── Players Tab ──

function PlayersTab({ players }: { players: PlayerStats[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playerData, setPlayerData] = useState<PlayerStats[]>(players);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Load persisted player stats
  useEffect(() => {
    fetch("/api/football/players")
      .then((r) => r.json())
      .then((data) => {
        if (data.players && data.players.length > 0) {
          setPlayerData(data.players);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/football/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Loaded ${data.count} players with card data`);
        // Refresh
        const refreshRes = await fetch("/api/football/players");
        const refreshData = await refreshRes.json();
        setPlayerData(refreshData.players || []);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch {
      setUploadStatus("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">Player Card Profiles</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Player CSV"}
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`text-sm rounded-xl p-3 ${
          uploadStatus.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
        }`}>
          {uploadStatus}
        </div>
      )}

      {playerData.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/30 text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">Player</th>
                  <th className="px-3 py-3 text-left">Team</th>
                  <th className="px-3 py-3 text-center">Pos</th>
                  <th className="px-3 py-3 text-center">MP</th>
                  <th className="px-3 py-3 text-center">Min</th>
                  <th className="px-3 py-3 text-center">🟨</th>
                  <th className="px-3 py-3 text-center">🟥</th>
                  <th className="px-3 py-3 text-center">Total</th>
                  <th className="px-3 py-3 text-center">Cards/Match</th>
                  <th className="px-3 py-3 text-center">Cards/90</th>
                  <th className="px-3 py-3 text-center">Min/Card</th>
                </tr>
              </thead>
              <tbody>
                {playerData.slice(0, 50).map((player, i) => (
                  <tr
                    key={`${player.player}-${player.squad}`}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-3 font-medium text-white">{player.player}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs">{player.squad}</td>
                    <td className="px-3 py-3 text-center text-gray-400 text-xs">{player.position}</td>
                    <td className="px-3 py-3 text-center text-gray-400">{player.matchesPlayed}</td>
                    <td className="px-3 py-3 text-center text-gray-400">{player.minutes}</td>
                    <td className="px-3 py-3 text-center text-yellow-400 font-medium">{player.yellowCards}</td>
                    <td className="px-3 py-3 text-center text-red-400 font-medium">{player.redCards || "-"}</td>
                    <td className="px-3 py-3 text-center font-bold text-white">{player.totalCards}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        player.cardsPerMatch >= 0.5 ? "bg-red-500/20 text-red-400" :
                        player.cardsPerMatch >= 0.3 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {player.cardsPerMatch}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">{player.cardsPerNinety}</td>
                    <td className="px-3 py-3 text-center text-gray-400">{player.minutesPerCard || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="text-white font-semibold mb-2">Upload Player Stats CSV</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Individual player booking data requires a CSV file from{" "}
            <a
              href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Kaggle
            </a>{" "}
            or FBref. The CSV should include columns for Player, Squad, MP (Matches Played),
            Min (Minutes), CrdY (Yellow Cards), and CrdR (Red Cards).
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-400 transition-colors"
          >
            Choose CSV File
          </button>
        </div>
      )}
    </div>
  );
}

// ── High-Card Matches Tab ──

function HighCardMatchesTab({ matches }: { matches: MatchData[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        Highest-Card Matches
      </h2>
      <p className="text-gray-500 text-sm">
        Top 10 matches by total cards — the fiercest battles this season
      </p>

      <div className="space-y-3">
        {matches.map((match, i) => (
          <div
            key={match.id}
            className={`bg-gray-900/50 border rounded-xl p-4 ${
              i === 0 ? "border-red-500/30 bg-red-500/5" :
              i < 3 ? "border-yellow-500/20" : "border-gray-800"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${
                  i === 0 ? "text-red-400" : i < 3 ? "text-yellow-400" : "text-gray-500"
                }`}>
                  #{i + 1}
                </span>
                <div>
                  <div className="text-white font-medium">
                    {match.homeTeam} {match.ftHomeGoals} - {match.ftAwayGoals} {match.awayTeam}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.date} • {match.league} • Ref: {match.referee}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  {match.totalCards}
                </div>
                <div className="text-xs text-gray-500">total cards</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-gray-500 mb-1">{match.homeTeam}</div>
                <div className="flex gap-3">
                  <span className="text-yellow-400">🟨 {match.homeYellows}</span>
                  <span className="text-red-400">🟥 {match.homeReds}</span>
                  <span className="text-gray-400">⚡ {match.homeFouls} fouls</span>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-gray-500 mb-1">{match.awayTeam}</div>
                <div className="flex gap-3">
                  <span className="text-yellow-400">🟨 {match.awayYellows}</span>
                  <span className="text-red-400">🟥 {match.awayReds}</span>
                  <span className="text-gray-400">⚡ {match.awayFouls} fouls</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
