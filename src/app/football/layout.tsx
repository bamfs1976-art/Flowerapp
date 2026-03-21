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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative">
        <FootballNav />
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-white/[0.04] py-6 text-center text-[11px] text-white/25 tracking-wide">
          Data from{" "}
          <a
            href="https://www.football-data.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/35 hover:text-emerald-400 transition-colors duration-200"
          >
            football-data.co.uk
          </a>
          {" \u00b7 "}
          <a
            href="https://github.com/datasets/football-datasets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/35 hover:text-emerald-400 transition-colors duration-200"
          >
            GitHub
          </a>
          {" \u00b7 "}
          Player stats via{" "}
          <a
            href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/35 hover:text-emerald-400 transition-colors duration-200"
          >
            Kaggle
          </a>
        </footer>
      </div>
    </div>
  );
}
