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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">League Standings</h1>
        <p className="text-gray-500 text-sm">
          Tables computed from match result CSV data
        </p>
      </div>

      <LeagueSelector selected={competition} onChange={setCompetition} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={20} />
      ) : standings.length > 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">Team</th>
                  <th className="px-3 py-3 text-center">P</th>
                  <th className="px-3 py-3 text-center">W</th>
                  <th className="px-3 py-3 text-center">D</th>
                  <th className="px-3 py-3 text-center">L</th>
                  <th className="px-3 py-3 text-center">GF</th>
                  <th className="px-3 py-3 text-center">GA</th>
                  <th className="px-3 py-3 text-center">GD</th>
                  <th className="px-3 py-3 text-center font-bold">Pts</th>
                  <th className="px-3 py-3 text-center">🟨</th>
                  <th className="px-3 py-3 text-center">🟥</th>
                  <th className="px-3 py-3 text-center">Cards/M</th>
                  <th className="px-3 py-3 text-center">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry, i) => (
                  <tr
                    key={entry.team}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                      i < 4
                        ? "border-l-2 border-l-emerald-500"
                        : i >= standings.length - 3
                        ? "border-l-2 border-l-red-500"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-gray-400 font-medium">
                      {entry.position}
                    </td>
                    <td className="px-3 py-3 font-medium text-white">
                      {entry.team}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      {entry.played}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-300">
                      {entry.won}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      {entry.drawn}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      {entry.lost}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-300">
                      {entry.goalsFor}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">
                      {entry.goalsAgainst}
                    </td>
                    <td
                      className={`px-3 py-3 text-center font-medium ${
                        entry.goalDifference > 0
                          ? "text-emerald-400"
                          : entry.goalDifference < 0
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      {entry.goalDifference > 0 ? "+" : ""}
                      {entry.goalDifference}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-white">
                      {entry.points}
                    </td>
                    <td className="px-3 py-3 text-center text-yellow-400 text-xs">
                      {entry.totalYellows}
                    </td>
                    <td className="px-3 py-3 text-center text-red-400 text-xs">
                      {entry.totalReds}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          entry.cardsPerMatch >= 2.5
                            ? "bg-red-500/20 text-red-400"
                            : entry.cardsPerMatch >= 1.5
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-emerald-500/20 text-emerald-400"
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
                            className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                              r === "W"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : r === "L"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-700 text-gray-400"
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

          <div className="px-4 py-3 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Champions League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Relegation
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-12">
          No standings data available for this league
        </div>
      )}
    </div>
  );
}
