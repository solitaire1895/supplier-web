import { Loader2 } from "lucide-react";

/** Instant fallback shown by loading.tsx while a route's server data streams in. */
export default function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black" role="status" aria-label="Loading">
      <Loader2 className="h-10 w-10 animate-spin text-red-500" />
    </div>
  );
}
