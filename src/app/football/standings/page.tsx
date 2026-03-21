"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComputedStanding, LeagueCode } from "@/lib/football-types";
import LeagueSelector from "@/components/football/LeagueSelector";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

export default function StandingsPage() {
  const [competition, setCompetition] = useState<LeagueCode>("E0");
  const [standings, setStandings] = useState<ComputedStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/football/standings?competition=${competition}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStandings(data.standings || []);
    } catch {
      setError("Failed to load standings");
    } finally {
      setLoading(false);
    }
  }, [competition]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight mb-1">League Standings</h1>
        <p className="text-white/35 text-[13px]">
          Tables computed from match result CSV data
        </p>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} />

      {error && (
        <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={20} />
      ) : standings.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full text-[12px] sm:text-[13px]" style={{ minWidth: 720 }}>
              <thead>
                <tr className="border-b border-white/[0.06] text-white/30 text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-3.5 text-left w-8">#</th>
                  <th className="px-3 py-3.5 text-left">Team</th>
                  <th className="px-3 py-3.5 text-center">P</th>
                  <th className="px-3 py-3.5 text-center">W</th>
                  <th className="px-3 py-3.5 text-center">D</th>
                  <th className="px-3 py-3.5 text-center">L</th>
                  <th className="px-3 py-3.5 text-center">GF</th>
                  <th className="px-3 py-3.5 text-center">GA</th>
                  <th className="px-3 py-3.5 text-center">GD</th>
                  <th className="px-3 py-3.5 text-center font-bold">Pts</th>
                  <th className="px-3 py-3.5 text-center">🟨</th>
                  <th className="px-3 py-3.5 text-center">🟥</th>
                  <th className="px-3 py-3.5 text-center">Cards/M</th>
                  <th className="px-3 py-3.5 text-center">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry, i) => (
                  <tr
                    key={entry.team}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150 ${
                      i < 4
                        ? "border-l-2 border-l-emerald-500/60"
                        : i >= standings.length - 3
                        ? "border-l-2 border-l-red-500/60"
                        : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className="px-3 py-3 text-white/30 font-medium tabular-nums">
                      {entry.position}
                    </td>
                    <td className="px-3 py-3 font-medium text-white/90">
                      {entry.team}
                    </td>
                    <td className="px-3 py-3 text-center text-white/30 tabular-nums">
                      {entry.played}
                    </td>
                    <td className="px-3 py-3 text-center text-white/60 tabular-nums">
                      {entry.won}
                    </td>
                    <td className="px-3 py-3 text-center text-white/30 tabular-nums">
                      {entry.drawn}
                    </td>
                    <td className="px-3 py-3 text-center text-white/30 tabular-nums">
                      {entry.lost}
                    </td>
                    <td className="px-3 py-3 text-center text-white/60 tabular-nums">
                      {entry.goalsFor}
                    </td>
                    <td className="px-3 py-3 text-center text-white/30 tabular-nums">
                      {entry.goalsAgainst}
                    </td>
                    <td
                      className={`px-3 py-3 text-center font-medium tabular-nums ${
                        entry.goalDifference > 0
                          ? "text-emerald-400/80"
                          : entry.goalDifference < 0
                          ? "text-red-400/80"
                          : "text-white/30"
                      }`}
                    >
                      {entry.goalDifference > 0 ? "+" : ""}
                      {entry.goalDifference}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-white tabular-nums">
                      {entry.points}
                    </td>
                    <td className="px-3 py-3 text-center text-yellow-400/70 text-[12px] tabular-nums">
                      {entry.totalYellows}
                    </td>
                    <td className="px-3 py-3 text-center text-red-400/70 text-[12px] tabular-nums">
                      {entry.totalReds}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                          entry.cardsPerMatch >= 2.5
                            ? "bg-red-500/[0.12] text-red-400/80"
                            : entry.cardsPerMatch >= 1.5
                            ? "bg-yellow-500/[0.12] text-yellow-400/80"
                            : "bg-emerald-500/[0.12] text-emerald-400/80"
                        }`}
                      >
                        {entry.cardsPerMatch}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-0.5 justify-center">
                        {entry.form.map((r, j) => (
                          <span
                            key={j}
                            className={`w-[18px] h-[18px] rounded-md text-[9px] flex items-center justify-center font-bold ${
                              r === "W"
                                ? "bg-emerald-500/[0.15] text-emerald-400/80"
                                : r === "L"
                                ? "bg-red-500/[0.15] text-red-400/80"
                                : "bg-white/[0.05] text-white/30"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-white/[0.04] flex gap-5 text-[11px] text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full" />
              Champions League
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500/60 rounded-full" />
              Relegation
            </span>
          </div>
        </div>
      ) : (
        <div className="text-white/30 text-center py-16 text-[13px]">
          No standings data available for this league
        </div>
      )}
    </div>
  );
}
