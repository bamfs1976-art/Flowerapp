"use client";

import { LeagueStanding } from "@/lib/types";

interface LeagueViewProps {
  standings: LeagueStanding[];
  currentTeam: string;
}

export default function LeagueView({ standings, currentTeam }: LeagueViewProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Mini-League Standings
      </h3>
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left text-xs text-gray-500 px-4 py-3 w-12">#</th>
                <th className="text-left text-xs text-gray-500 px-4 py-3">Team</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">GW Pts</th>
                <th className="text-right text-xs text-gray-500 px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => {
                const isMe = entry.teamName === currentTeam;
                return (
                  <tr
                    key={entry.rank}
                    className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                      isMe
                        ? "bg-emerald-500/5"
                        : "hover:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-bold font-mono ${
                          entry.rank === 1
                            ? "text-amber-400"
                            : entry.rank <= 3
                              ? "text-gray-300"
                              : "text-gray-500"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-semibold ${isMe ? "text-emerald-400" : "text-gray-100"}`}>
                        {entry.teamName}
                        {isMe && (
                          <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{entry.managerName}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-mono text-gray-300">{entry.gameweekPoints}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold font-mono text-gray-100">
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
