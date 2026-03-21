import type { Metadata } from "next";
import FootballNav from "@/components/football/FootballNav";

export const metadata: Metadata = {
  title: "Football Analytics — Bookings, Standings & Insights",
  description:
    "European football analytics with a focus on player bookings, referee strictness, and discipline data across top leagues. Powered by CSV data — no API key required.",
};

export default function FootballLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <FootballNav />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Data from{" "}
        <a
          href="https://www.football-data.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-emerald-400 transition-colors"
        >
          football-data.co.uk
        </a>
        {" • "}
        <a
          href="https://github.com/datasets/football-datasets"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-emerald-400 transition-colors"
        >
          GitHub football-datasets
        </a>
        {" • "}
        Player stats from{" "}
        <a
          href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-emerald-400 transition-colors"
        >
          Kaggle
        </a>
        {" — No API key required"}
      </footer>
    </div>
  );
}
