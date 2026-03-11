"use client";

import { Player } from "@/lib/types";
import { formatPrice, POSITION_COLORS, TEAM_COLORS } from "@/lib/mock-data";

interface SquadViewProps {
  squad: Player[];
}

export default function SquadView({ squad }: SquadViewProps) {
  const starters = squad.filter((p) => !p.isBenched);
  const bench = squad.filter((p) => p.isBenched);

  const gkp = starters.filter((p) => p.position === "GKP");
  const def = starters.filter((p) => p.position === "DEF");
  const mid = starters.filter((p) => p.position === "MID");
  const fwd = starters.filter((p) => p.position === "FWD");

  return (
    <div>
      {/* Pitch view */}
      <div className="bg-gradient-to-b from-emerald-900/30 to-emerald-950/20 rounded-xl border border-emerald-800/30 p-4 sm:p-6 mb-4">
        <div className="text-center text-xs text-emerald-600/60 uppercase tracking-widest mb-4">
          Starting XI
        </div>

        <div className="space-y-4">
          <PitchRow players={gkp} />
          <PitchRow players={def} />
          <PitchRow players={mid} />
          <PitchRow players={fwd} />
        </div>
      </div>

      {/* Bench */}
      <div className="bg-gray-800/30 rounded-xl border border-gray-700/40 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Bench</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {bench.map((player) => (
            <PlayerPitchCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PitchRow({ players }: { players: Player[] }) {
  return (
    <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
      {players.map((player) => (
        <PlayerPitchCard key={player.id} player={player} />
      ))}
    </div>
  );
}

function PlayerPitchCard({ player }: { player: Player }) {
  const teamColor = TEAM_COLORS[player.team] || "#6b7280";
  const posColor = POSITION_COLORS[player.position];

  return (
    <div className="group relative bg-gray-900/80 rounded-lg border border-gray-700/50 p-2 sm:p-3 w-[100px] sm:w-[120px] hover:border-emerald-500/50 transition-colors cursor-default">
      {/* Captain/VC badge */}
      {player.isCaptain && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-gray-900">
          C
        </div>
      )}
      {player.isViceCaptain && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-400 text-[10px] font-bold flex items-center justify-center text-gray-900">
          V
        </div>
      )}

      {/* Injury flag */}
      {player.news && (
        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">
          !
        </div>
      )}

      {/* Position badge */}
      <div
        className="text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block"
        style={{ backgroundColor: posColor + "22", color: posColor }}
      >
        {player.position}
      </div>

      {/* Name */}
      <div className="text-xs sm:text-sm font-semibold text-gray-100 truncate">
        {player.name}
      </div>

      {/* Team */}
      <div className="text-[10px] text-gray-500 flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ backgroundColor: teamColor }}
        />
        {player.team}
      </div>

      {/* Points */}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-lg font-bold text-emerald-400 font-mono">
          {player.gameweekPoints}
        </span>
        <span className="text-[10px] text-gray-500">
          {formatPrice(player.price)}
        </span>
      </div>

      {/* Hover tooltip */}
      <div className="hidden group-hover:block absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Pts</span>
            <span className="text-gray-100 font-mono">{player.totalPoints}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Form</span>
            <span className="text-gray-100 font-mono">{player.form}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Goals</span>
            <span className="text-gray-100 font-mono">{player.goals}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Assists</span>
            <span className="text-gray-100 font-mono">{player.assists}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">xGI</span>
            <span className="text-gray-100 font-mono">{player.expectedGoalInvolvements.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ICT</span>
            <span className="text-gray-100 font-mono">{player.ictIndex}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Selected</span>
            <span className="text-gray-100 font-mono">{player.selectedBy}</span>
          </div>
          {player.news && (
            <div className="mt-1 text-red-400 text-[10px]">{player.news}</div>
          )}
        </div>
      </div>
    </div>
  );
}
