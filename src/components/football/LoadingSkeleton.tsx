"use client";

export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="w-8 h-8 rounded-xl animate-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-lg animate-shimmer w-3/4" />
            <div className="h-2 rounded-lg animate-shimmer w-1/2" />
          </div>
          <div className="w-12 h-6 rounded-lg animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
