"use client";

import { useState } from "react";
import { TabId } from "@/lib/types";
import {
  mockSquad,
  mockGameweek,
  mockManager,
  mockFixtures,
  mockTeamFixtures,
  mockTransferTargets,
  mockLeague,
} from "@/lib/mock-data";
import ManagerHeader from "@/components/ManagerHeader";
import TabNav from "@/components/TabNav";
import SquadView from "@/components/SquadView";
import TransfersView from "@/components/TransfersView";
import FixturesView from "@/components/FixturesView";
import LeagueView from "@/components/LeagueView";
import AnalyticsView from "@/components/AnalyticsView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("squad");

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <ManagerHeader manager={mockManager} gameweek={mockGameweek} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === "squad" && <SquadView squad={mockSquad} />}
        {activeTab === "transfers" && (
          <TransfersView targets={mockTransferTargets} manager={mockManager} />
        )}
        {activeTab === "fixtures" && (
          <FixturesView fixtures={mockFixtures} teamFixtures={mockTeamFixtures} />
        )}
        {activeTab === "league" && (
          <LeagueView standings={mockLeague} currentTeam={mockManager.teamName} />
        )}
        {activeTab === "analytics" && <AnalyticsView squad={mockSquad} />}
      </main>

      <footer className="mt-12 text-center text-xs text-gray-600">
        <p>FPL War Room &middot; Fantasy Premier League Dashboard</p>
      </footer>
    </div>
  );
}
