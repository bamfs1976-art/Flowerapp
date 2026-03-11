"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-4">
        {/* Outer ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        {/* Inner leaf */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-6 w-6 animate-pulse text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
        </div>
      </div>
      <p className="text-lg font-medium text-green-800">
        Analyzing your plant...
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Our AI botanist is examining the photo
      </p>
    </div>
  );
}
