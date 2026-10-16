"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

/** Shared error boundary UI: a failed server render shows a retry, never a blank or frozen page. */
export default function RouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <h2 className="text-xl font-semibold">Something went wrong / Une erreur est survenue</h2>
      <p className="max-w-md text-sm text-gray-400">
        The page could not load. Check your connection and try again.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
      >
        Try again / Réessayer
      </button>
    </div>
  );
}
