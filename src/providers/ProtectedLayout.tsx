"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      if (pathname && pathname !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", pathname);
      }
      router.replace("/login");
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading workspace...
        </div>
      </div>
    );
  }

  return <CommandPaletteProvider>{children}</CommandPaletteProvider>;
}
