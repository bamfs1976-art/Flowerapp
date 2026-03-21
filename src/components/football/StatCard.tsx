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
  emerald: {
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/[0.12]",
    value: "text-emerald-400",
    icon: "bg-emerald-500/[0.15]",
  },
  yellow: {
    bg: "bg-yellow-500/[0.08]",
    border: "border-yellow-500/[0.12]",
    value: "text-yellow-400",
    icon: "bg-yellow-500/[0.15]",
  },
  red: {
    bg: "bg-red-500/[0.08]",
    border: "border-red-500/[0.12]",
    value: "text-red-400",
    icon: "bg-red-500/[0.15]",
  },
  blue: {
    bg: "bg-blue-500/[0.08]",
    border: "border-blue-500/[0.12]",
    value: "text-blue-400",
    icon: "bg-blue-500/[0.15]",
  },
  gray: {
    bg: "bg-white/[0.03]",
    border: "border-white/[0.06]",
    value: "text-gray-300",
    icon: "bg-white/[0.08]",
  },
};

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  color = "emerald",
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <span className="text-[11px] sm:text-[13px] text-white/50 font-medium leading-tight">{label}</span>
        {icon && (
          <span className={`${c.icon} w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`text-[22px] sm:text-[28px] font-bold tracking-tight ${c.value} leading-none tabular-nums`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] sm:text-[11px] text-white/30 mt-1 sm:mt-1.5 tracking-wide">{sublabel}</div>
      )}
    </div>
  );
}
