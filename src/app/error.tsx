"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-h2 text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-active transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
