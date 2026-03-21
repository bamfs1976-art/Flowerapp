"use client";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  data,
  maxValue,
  height = 200,
  showValues = true,
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5 justify-between" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / max) * (height - 36);
        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
            {showValues && (
              <span className="text-[11px] text-white/40 font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {item.value}
              </span>
            )}
            <div
              className="w-full rounded-lg transition-all duration-700 ease-out group-hover:opacity-90"
              style={{
                height: barHeight,
                backgroundColor: item.color || "#10b981",
                minHeight: item.value > 0 ? 4 : 0,
                opacity: 0.7,
              }}
            />
            <span className="text-[10px] text-white/30 text-center leading-tight font-medium">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
