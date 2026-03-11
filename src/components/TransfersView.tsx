"use client";

import { TransferTarget, ManagerInfo } from "@/lib/types";
import { formatPrice, POSITION_COLORS } from "@/lib/mock-data";

interface TransfersViewProps {
  targets: TransferTarget[];
  manager: ManagerInfo;
}

export default function TransfersView({ targets, manager }: TransfersViewProps) {
  return (
    <div className="space-y-6">
      {/* Transfer budget info */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 flex flex-wrap gap-6">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Free Transfers</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{manager.freeTransfers}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">In the Bank</div>
          <div className="text-2xl font-bold font-mono text-gray-100">{formatPrice(manager.bank)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Transfer Cost</div>
          <div className="text-2xl font-bold font-mono text-gray-500">-4 pts/extra</div>
        </div>
      </div>

      {/* Suggested transfers */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Suggested Transfers
        </h3>
        <div className="space-y-3">
          {targets.map((target, i) => (
            <TransferCard key={i} target={target} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransferCard({ target }: { target: TransferTarget }) {
  const posColor = POSITION_COLORS[target.playerOut.position];

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: posColor + "22", color: posColor }}
        >
          {target.playerOut.position}
        </span>
        <span className="text-xs text-emerald-400 font-semibold">
          +{target.pointsGain} projected pts/GW
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          {target.netCost > 0 ? "+" : ""}{formatPrice(target.netCost)} net
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Player out */}
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Out</div>
          <div className="text-sm font-semibold text-gray-100">{target.playerOut.name}</div>
          <div className="text-xs text-gray-500">{target.playerOut.team}</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
            <div>
              <div className="text-gray-500">Form</div>
              <div className="text-gray-300 font-mono">{target.playerOut.form}</div>
            </div>
            <div>
              <div className="text-gray-500">Pts</div>
              <div className="text-gray-300 font-mono">{target.playerOut.totalPoints}</div>
            </div>
            <div>
              <div className="text-gray-500">Price</div>
              <div className="text-gray-300 font-mono">{formatPrice(target.playerOut.price)}</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-emerald-500 text-xl shrink-0">&rarr;</div>

        {/* Player in */}
        <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">In</div>
          <div className="text-sm font-semibold text-gray-100">{target.playerIn.name}</div>
          <div className="text-xs text-gray-500">{target.playerIn.team}</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
            <div>
              <div className="text-gray-500">Form</div>
              <div className="text-gray-300 font-mono">{target.playerIn.form}</div>
            </div>
            <div>
              <div className="text-gray-500">Pts</div>
              <div className="text-gray-300 font-mono">{target.playerIn.totalPoints}</div>
            </div>
            <div>
              <div className="text-gray-500">Price</div>
              <div className="text-gray-300 font-mono">{formatPrice(target.playerIn.price)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
