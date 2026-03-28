"use client";

import { TabId } from "@/lib/types";

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "squad", label: "Squad", icon: "⬡" },
  { id: "transfers", label: "Transfers", icon: "⇄" },
  { id: "fixtures", label: "Fixtures", icon: "▦" },
  { id: "league", label: "League", icon: "▲" },
  { id: "analytics", label: "Analytics", icon: "◈" },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent"
          }`}
        >
          <span className="text-xs">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
