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
    <div className="space-y-3.5">
      {items.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] text-white/70 truncate max-w-[60%] font-medium">
              {item.label}
            </span>
            <div className="flex items-center gap-2.5">
              {item.sublabel && (
                <span className="text-[11px] text-white/30">{item.sublabel}</span>
              )}
              <span className="text-[13px] font-semibold text-white tabular-nums">{item.value}</span>
            </div>
          </div>
          <div className="h-[6px] bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color || "#10b981",
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
