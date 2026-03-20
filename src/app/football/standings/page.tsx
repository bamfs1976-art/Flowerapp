"use client";

import { useState, useEffect, useCallback } from "react";
import type { Standing, StandingEntry, CompetitionCode } from "@/lib/football-types";
import LeagueSelector from "@/components/football/LeagueSelector";
import LoadingSkeleton from "@/components/football/LoadingSkeleton";

export default function StandingsPage() {
  const [competition, setCompetition] = useState<CompetitionCode>("PL");
  const [standings, setStandings] = useState<Standing[]>([]);
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

  const totalStanding = standings.find((s) => s.type === "TOTAL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">League Standings</h1>
        <p className="text-gray-500 text-sm">
          Current season tables for top European leagues
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
      ) : totalStanding ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">W</th>
                  <th className="px-4 py-3 text-center">D</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">GF</th>
                  <th className="px-4 py-3 text-center">GA</th>
                  <th className="px-4 py-3 text-center">GD</th>
                  <th className="px-4 py-3 text-center font-bold">Pts</th>
                  <th className="px-4 py-3 text-center">Form</th>
                </tr>
              </thead>
              <tbody>
                {totalStanding.table.map((entry: StandingEntry, i: number) => (
                  <tr
                    key={entry.team.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                      i < 4
                        ? "border-l-2 border-l-emerald-500"
                        : i >= totalStanding.table.length - 3
                        ? "border-l-2 border-l-red-500"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 font-medium">
                      {entry.position}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.team.crest && (
                          <img
                            src={entry.team.crest}
                            alt=""
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="font-medium text-white">
                          {entry.team.shortName || entry.team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {entry.playedGames}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {entry.won}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {entry.draw}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {entry.lost}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {entry.goalsFor}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {entry.goalsAgainst}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-medium ${
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
                    <td className="px-4 py-3 text-center font-bold text-white">
                      {entry.points}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-0.5 justify-center">
                        {entry.form?.split(",").map((r, j) => (
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
          No standings data available
        </div>
      )}
    </div>
  );
}
