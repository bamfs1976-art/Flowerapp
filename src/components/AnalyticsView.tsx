"use client";

import { Player } from "@/lib/types";
import { formatPrice, POSITION_COLORS } from "@/lib/mock-data";

interface AnalyticsViewProps {
  squad: Player[];
}

export default function AnalyticsView({ squad }: AnalyticsViewProps) {
  const starters = squad.filter((p) => !p.isBenched);

  // Sort by various metrics
  const byForm = [...starters].sort((a, b) => parseFloat(b.form) - parseFloat(a.form));
  const byXGI = [...starters].sort((a, b) => b.expectedGoalInvolvements - a.expectedGoalInvolvements);
  const byICT = [...starters].sort((a, b) => parseFloat(b.ictIndex) - parseFloat(a.ictIndex));
  const byValue = [...starters].sort(
    (a, b) => b.totalPoints / b.price - a.totalPoints / a.price
  );

  // Squad breakdown
  const totalValue = squad.reduce((sum, p) => sum + p.price, 0);
  const totalPoints = starters.reduce((sum, p) => sum + p.gameweekPoints, 0);
  const avgForm = (starters.reduce((sum, p) => sum + parseFloat(p.form), 0) / starters.length).toFixed(1);
  const totalXGI = starters.reduce((sum, p) => sum + p.expectedGoalInvolvements, 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnalyticCard label="Squad Value" value={formatPrice(totalValue)} />
        <AnalyticCard label="GW Points (XI)" value={totalPoints.toString()} accent />
        <AnalyticCard label="Avg Form" value={avgForm} />
        <AnalyticCard label="Total xGI" value={totalXGI} />
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Leaderboard title="Top by Form" players={byForm.slice(0, 5)} metric="form" getValue={(p) => p.form} />
        <Leaderboard title="Top by xGI" players={byXGI.slice(0, 5)} metric="xGI" getValue={(p) => p.expectedGoalInvolvements.toFixed(1)} />
        <Leaderboard title="Top by ICT Index" players={byICT.slice(0, 5)} metric="ICT" getValue={(p) => p.ictIndex} />
        <Leaderboard
          title="Best Value (Pts/£)"
          players={byValue.slice(0, 5)}
          metric="Pts/£"
          getValue={(p) => (p.totalPoints / p.price * 10).toFixed(1)}
        />
      </div>

      {/* Position breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Position Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["GKP", "DEF", "MID", "FWD"] as const).map((pos) => {
            const posPlayers = squad.filter((p) => p.position === pos);
            const posPoints = posPlayers.reduce((s, p) => s + p.totalPoints, 0);
            const posValue = posPlayers.reduce((s, p) => s + p.price, 0);
            return (
              <div
                key={pos}
                className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: POSITION_COLORS[pos] + "22",
                      color: POSITION_COLORS[pos],
                    }}
                  >
                    {pos}
                  </span>
                  <span className="text-xs text-gray-500">{posPlayers.length} players</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Pts</span>
                    <span className="text-gray-100 font-mono">{posPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Value</span>
                    <span className="text-gray-100 font-mono">{formatPrice(posValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Pts</span>
                    <span className="text-gray-100 font-mono">
                      {(posPoints / posPlayers.length).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 px-4 py-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold font-mono ${accent ? "text-emerald-400" : "text-gray-100"}`}>
        {value}
      </div>
    </div>
  );
}

function Leaderboard({
  title,
  players,
  metric,
  getValue,
}: {
  title: string;
  players: Player[];
  metric: string;
  getValue: (p: Player) => string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
      <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2">
        {players.map((player, i) => (
          <div key={player.id} className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-600 w-4">{i + 1}</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: POSITION_COLORS[player.position] }}
            />
            <span className="text-sm text-gray-200 flex-1 truncate">{player.name}</span>
            <span className="text-sm font-mono text-emerald-400 font-semibold">
              {getValue(player)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
