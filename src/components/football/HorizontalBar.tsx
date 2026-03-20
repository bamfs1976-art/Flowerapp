"use client";

interface HorizontalBarProps {
  items: {
    label: string;
    value: number;
    sublabel?: string;
    color?: string;
  }[];
  maxValue?: number;
}

export default function HorizontalBar({ items, maxValue }: HorizontalBarProps) {
  const max = maxValue ?? Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300 truncate max-w-[60%]">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {item.sublabel && (
                <span className="text-xs text-gray-500">{item.sublabel}</span>
              )}
              <span className="text-sm font-bold text-white">{item.value}</span>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color || "#10b981",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
