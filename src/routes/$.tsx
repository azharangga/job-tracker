import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const AppRouter = lazy(() => import("@/app/AppRouter"));

/**
 * Catch-all splat: the entire app runs under React Router DOM (BrowserRouter).
 * We disable SSR here because BrowserRouter needs `window.history`.
 */
export const Route = createFileRoute("/$")({
  ssr: false,
  component: SplatEntry,
});

function SplatEntry() {
  // Hydration guard — mount only in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <AppRouter />
    </Suspense>
  );
}
