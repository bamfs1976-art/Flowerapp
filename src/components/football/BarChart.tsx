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
    <div className="flex items-end gap-2 justify-between" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / max) * (height - 30);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {showValues && (
              <span className="text-xs text-gray-400 font-medium">
                {item.value}
              </span>
            )}
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: barHeight,
                backgroundColor: item.color || "#10b981",
                minHeight: item.value > 0 ? 4 : 0,
              }}
            />
            <span className="text-[10px] text-gray-500 text-center leading-tight">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
