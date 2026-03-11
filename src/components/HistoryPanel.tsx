"use client";

import { IdentificationResult } from "@/lib/types";

interface HistoryPanelProps {
  history: IdentificationResult[];
  onSelect: (result: IdentificationResult) => void;
  onClear: () => void;
}

export default function HistoryPanel({
  history,
  onSelect,
  onClear,
}: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Recent Identifications
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 transition hover:text-red-500"
        >
          Clear history
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {history.map((result, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(result)}
            className="group flex-shrink-0 text-left"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-transparent transition group-hover:border-green-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt={result.plant.commonName}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-1 w-16 truncate text-center text-xs text-gray-500 group-hover:text-green-700">
              {result.plant.commonName}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
