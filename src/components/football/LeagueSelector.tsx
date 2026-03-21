"use client";

import { CSV_LEAGUES, type LeagueCode } from "@/lib/football-types";

interface LeagueSelectorProps {
  selected: string;
  onChange: (code: LeagueCode) => void;
  showAll?: boolean;
}

export default function LeagueSelector({ selected, onChange, showAll }: LeagueSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {showAll && (
        <button
          onClick={() => onChange("" as LeagueCode)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === ""
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          🌍 All Leagues
        </button>
      )}
      {CSV_LEAGUES.map((comp) => (
        <button
          key={comp.code}
          onClick={() => onChange(comp.code as LeagueCode)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === comp.code
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <span className="mr-1">{comp.flag}</span>
          {comp.name}
        </button>
      ))}
    </div>
  );
}
