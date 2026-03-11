"use client";

import { PlantIdentification } from "@/lib/types";

interface PlantResultProps {
  plant: PlantIdentification;
  imageUrl: string;
  onReset: () => void;
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors = {
    high: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
        colors[confidence as keyof typeof colors] || colors.medium
      }`}
    >
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
    </span>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export default function PlantResult({
  plant,
  imageUrl,
  onReset,
}: PlantResultProps) {
  if (plant.commonName === "Not a plant") {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="mb-4 text-gray-700">{plant.description}</p>
        <button
          onClick={onReset}
          className="rounded-xl bg-green-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Try Another Photo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with image and basic info */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-56 w-full overflow-hidden sm:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={plant.commonName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 text-white">
            <h2 className="text-2xl font-bold">{plant.commonName}</h2>
            <p className="text-sm italic opacity-90">{plant.scientificName}</p>
            <p className="text-xs opacity-75">Family: {plant.family}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ConfidenceBadge confidence={plant.confidence} />
            {plant.isToxic && (
              <span className="inline-block rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                Toxic
              </span>
            )}
            {plant.isEdible && (
              <span className="inline-block rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                Edible
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            {plant.description}
          </p>
          {plant.toxicityNote && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              {plant.toxicityNote}
            </p>
          )}
        </div>
      </div>

      {/* Care Information */}
      {plant.careInfo.sunlight && (
        <InfoCard
          title="Care Guide"
          icon={
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-700">Sunlight</p>
              <p className="text-gray-500">{plant.careInfo.sunlight}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Water</p>
              <p className="text-gray-500">{plant.careInfo.water}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Soil</p>
              <p className="text-gray-500">{plant.careInfo.soil}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Temperature</p>
              <p className="text-gray-500">{plant.careInfo.temperature}</p>
            </div>
          </div>
        </InfoCard>
      )}

      {/* Fun Facts */}
      {plant.funFacts.length > 0 && (
        <InfoCard
          title="Fun Facts"
          icon={
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        >
          <ul className="space-y-2">
            {plant.funFacts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                {fact}
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      {/* Action button */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="rounded-xl bg-green-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Identify Another Plant
        </button>
      </div>
    </div>
  );
}
