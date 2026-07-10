import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 min-w-0">
          {children}
        </main>
        <footer className="border-t border-hairline px-4 sm:px-6 py-4 text-[11px] sm:text-xs text-ink-faint flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.tagline")}</span>
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  count,
  actions,
}: {
  title: string;
  description?: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 sm:mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-h3 sm:text-h2 text-ink truncate">{title}</h1>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[11px] font-semibold rounded-full bg-ink/5 border border-hairline text-ink-secondary tabular-nums">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-ink-muted max-w-2xl line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
