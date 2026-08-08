"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import PlantResult from "@/components/PlantResult";
import LoadingSpinner from "@/components/LoadingSpinner";
import HistoryPanel from "@/components/HistoryPanel";
import { PlantIdentification, IdentificationResult } from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    plant: PlantIdentification;
    imageUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<IdentificationResult[]>([]);

  const identifyPlant = useCallback(
    async (base64: string, mediaType: string, previewUrl: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to identify plant");
        }

        const newResult = { plant: data.plant, imageUrl: previewUrl };
        setResult(newResult);

        // Add to history (keep latest 10)
        if (data.plant.commonName !== "Not a plant") {
          setHistory((prev) => [
            { ...newResult, timestamp: new Date().toISOString() },
            ...prev.slice(0, 9),
          ]);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handleHistorySelect = (item: IdentificationResult) => {
    setResult({ plant: item.plant, imageUrl: item.imageUrl });
    setError(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-lg">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c4.97 0 9 4.03 9 9-4.97 0-9-4.03-9-9zM3 12c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Flowerapp</h1>
        <p className="mt-1 text-sm text-gray-500">
          Snap a photo to identify any plant or flower
        </p>
        <Link
          href="/weather"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-800 transition hover:bg-green-50"
        >
          ⛅ Open the weather dashboard
        </Link>
      </header>

      {/* Main content */}
      <main className="space-y-6">
        {!result && !isLoading && (
          <ImageUploader
            onImageSelected={identifyPlant}
            isLoading={isLoading}
          />
        )}

        {isLoading && <LoadingSpinner />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="mb-3 text-sm text-red-700">{error}</p>
            <button
              onClick={handleReset}
              className="rounded-xl bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {result && !isLoading && (
          <PlantResult
            plant={result.plant}
            imageUrl={result.imageUrl}
            onReset={handleReset}
          />
        )}

        <HistoryPanel
          history={history}
          onSelect={handleHistorySelect}
          onClear={() => setHistory([])}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        <p>Powered by Claude AI &middot; For educational purposes</p>
        <p className="mt-1">
          Always verify plant identification before consumption
        </p>
      </footer>
    </div>
  );
}
