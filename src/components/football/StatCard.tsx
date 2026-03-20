"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  color?: "emerald" | "yellow" | "red" | "blue" | "gray";
}

const colorMap = {
  emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  red: "from-red-500/20 to-red-600/10 border-red-500/30",
  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  gray: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
};

const valueColorMap = {
  emerald: "text-emerald-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  blue: "text-blue-400",
  gray: "text-gray-300",
};

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = "emerald",
}: StatCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${valueColorMap[color]}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-gray-500 text-xs mt-1">{sublabel}</div>
      )}
    </div>
  );
}
