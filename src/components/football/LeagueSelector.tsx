"use client";

import { CSV_LEAGUES, type LeagueCode } from "@/lib/football-types";

interface LeagueSelectorProps {
  selected: string;
  onChange: (code: LeagueCode) => void;
  showAll?: boolean;
}

export default function LeagueSelector({ selected, onChange, showAll }: LeagueSelectorProps) {
  return (
    <div className="overflow-x-auto scroll-touch -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex sm:flex-wrap gap-1.5 pb-1 sm:pb-0">
        {showAll && (
          <button
            onClick={() => onChange("" as LeagueCode)}
            className={`flex-shrink-0 px-3.5 py-2 sm:py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
              selected === ""
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/[0.04] text-white/40 active:bg-white/[0.08]"
            }`}
          >
            All Leagues
          </button>
        )}
        {CSV_LEAGUES.map((comp) => (
          <button
            key={comp.code}
            onClick={() => onChange(comp.code as LeagueCode)}
            className={`flex-shrink-0 px-3.5 py-2 sm:py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
              selected === comp.code
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-white/[0.04] text-white/40 active:bg-white/[0.08]"
            }`}
          >
            <span className="mr-1">{comp.flag}</span>
            <span className="hidden sm:inline">{comp.name}</span>
            <span className="sm:hidden">{comp.code === "E0" ? "PL" : comp.code === "E1" ? "CH" : comp.name.length > 8 ? comp.name.slice(0, 6) : comp.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
