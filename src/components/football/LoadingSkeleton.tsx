"use client";

export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-800 rounded w-3/4" />
            <div className="h-2 bg-gray-800/50 rounded w-1/2" />
          </div>
          <div className="w-12 h-6 bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
}
