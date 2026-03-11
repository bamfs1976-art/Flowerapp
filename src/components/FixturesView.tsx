"use client";

import { Fixture, TeamFixtures } from "@/lib/types";
import { getDifficultyColor, getDifficultyTextColor } from "@/lib/mock-data";

interface FixturesViewProps {
  fixtures: Fixture[];
  teamFixtures: TeamFixtures[];
}

export default function FixturesView({ fixtures, teamFixtures }: FixturesViewProps) {
  return (
    <div className="space-y-6">
      {/* Next GW fixtures */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          GW{fixtures[0]?.gameweek} Fixtures
        </h3>
        <div className="grid gap-2">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      </div>

      {/* FDR Ticker — 5-game fixture difficulty */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Fixture Difficulty Ticker (Next 5 GWs)
        </h3>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left text-xs text-gray-500 px-4 py-2 w-24">Team</th>
                  {teamFixtures[0]?.fixtures.map((f) => (
                    <th key={f.gameweek} className="text-center text-xs text-gray-500 px-2 py-2">
                      GW{f.gameweek}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamFixtures.map((tf) => (
                  <tr key={tf.team} className="border-b border-gray-800/50 last:border-0">
                    <td className="text-sm font-semibold text-gray-200 px-4 py-2">{tf.shortName}</td>
                    {tf.fixtures.map((f) => {
                      const isHome = f.homeTeam === tf.team;
                      const opponent = isHome ? f.awayTeam : f.homeTeam;
                      const shortOpponent = opponent.length > 3
                        ? opponent.substring(0, 3).toUpperCase()
                        : opponent.toUpperCase();
                      return (
                        <td key={f.id} className="text-center px-2 py-2">
                          <div
                            className="inline-flex items-center justify-center w-16 h-8 rounded text-xs font-bold"
                            style={{
                              backgroundColor: getDifficultyColor(f.difficulty),
                              color: getDifficultyTextColor(f.difficulty),
                            }}
                          >
                            {shortOpponent} ({isHome ? "H" : "A"})
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const kickoff = new Date(fixture.kickoff);
  const dayStr = kickoff.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 px-4 py-3 flex items-center justify-between">
      <div className="flex-1 text-right">
        <span className="text-sm font-semibold text-gray-100">{fixture.homeTeam}</span>
      </div>
      <div className="px-4 text-center">
        <div className="text-xs text-gray-500">{dayStr}</div>
        <div className="text-lg font-bold font-mono text-emerald-400">
          {fixture.finished
            ? `${fixture.homeScore} - ${fixture.awayScore}`
            : timeStr}
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm font-semibold text-gray-100">{fixture.awayTeam}</span>
      </div>
    </div>
  );
}
