import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const AppRouter = lazy(() => import("@/app/AppRouter"));

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexEntry,
});

function IndexEntry() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <AppRouter />
    </Suspense>
  );
}
