"use client";

import { ManagerInfo, GameweekStatus } from "@/lib/types";
import { formatPrice } from "@/lib/mock-data";

interface ManagerHeaderProps {
  manager: ManagerInfo;
  gameweek: GameweekStatus;
}

export default function ManagerHeader({ manager, gameweek }: ManagerHeaderProps) {
  const deadline = new Date(gameweek.deadlineTime);
  const now = new Date();
  const hoursUntilDeadline = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const daysUntilDeadline = Math.floor(hoursUntilDeadline / 24);
  const remainingHours = hoursUntilDeadline % 24;

  const chips = [
    { name: "WC", available: manager.wildcardAvailable },
    { name: "BB", available: manager.benchBoostAvailable },
    { name: "TC", available: manager.tripleCaptainAvailable },
    { name: "FH", available: manager.freeHitAvailable },
  ];

  return (
    <div className="mb-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-emerald-400">FPL</span> War Room
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {manager.teamName} &middot; {manager.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
            GW{gameweek.current} Deadline:{" "}
            {daysUntilDeadline > 0
              ? `${daysUntilDeadline}d ${remainingHours}h`
              : `${remainingHours}h`}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="GW Points" value={manager.gameweekPoints.toString()} accent />
        <StatCard label="GW Rank" value={manager.gameweekRank.toLocaleString()} />
        <StatCard label="Overall Pts" value={manager.overallPoints.toLocaleString()} />
        <StatCard label="Overall Rank" value={manager.overallRank.toLocaleString()} />
        <StatCard label="Bank" value={formatPrice(manager.bank)} />
        <StatCard label="Free Transfers" value={manager.freeTransfers.toString()} />
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 px-3 py-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Chips</div>
          <div className="flex gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.name}
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  chip.available
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-700/50 text-gray-600 line-through"
                }`}
              >
                {chip.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 px-3 py-2">
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold font-mono ${accent ? "text-emerald-400" : "text-gray-100"}`}>
        {value}
      </div>
    </div>
  );
}
