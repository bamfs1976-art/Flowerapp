"use client";

import { CSV_LEAGUES, type LeagueCode } from "@/lib/football-types";

interface LeagueSelectorProps {
  selected: string;
  onChange: (code: LeagueCode) => void;
  showAll?: boolean;
}

export default function LeagueSelector({ selected, onChange, showAll }: LeagueSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {showAll && (
        <button
          onClick={() => onChange("" as LeagueCode)}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
            selected === ""
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
          }`}
        >
          All Leagues
        </button>
      )}
      {CSV_LEAGUES.map((comp) => (
        <button
          key={comp.code}
          onClick={() => onChange(comp.code as LeagueCode)}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
            selected === comp.code
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
          }`}
        >
          <span className="mr-1">{comp.flag}</span>
          {comp.name}
        </button>
      ))}
    </div>
  );
}
