import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/contexts/AuthContext";
import { RotateCcw, Sun, Moon } from "lucide-react";
import { Logo } from "../common/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

export function AppShell({ children, publicMode = false }: { children: ReactNode; publicMode?: boolean }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const isDemoMode = auth?.isDemoMode ?? false;
  const resetDemoData = auth?.resetDemoData ?? (() => {});
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background flex-col">
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-500 text-white dark:text-slate-900 text-[10px] uppercase tracking-wider">Demo Mode</span>
            <span>{t("demo.bannerText")}</span>
          </div>
          <button
            onClick={resetDemoData}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 text-white dark:text-slate-900 font-medium hover:bg-amber-600 active:scale-95 transition-all text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            {t("demo.resetButton")}
          </button>
        </div>
      )}
      <div className="flex flex-1 w-full">
        {!publicMode && <Sidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          {!publicMode ? (
            <Topbar />
          ) : (
            <header className="border-b border-hairline bg-surface h-14 shrink-0 flex items-center justify-between px-6 sm:px-8">
              <div className="flex items-center gap-2.5 min-w-0">
                <Logo className="h-7 w-7 shrink-0" />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-semibold text-ink leading-none truncate">
                    {t("app.name")}
                  </span>
                  <span className="text-[11px] text-ink-faint leading-tight mt-0.5 truncate">
                    {t("app.tagline")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  onClick={toggle}
                  aria-label={t("topbar.toggleTheme")}
                  className="h-8 w-8 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted transition-colors text-ink-muted hover:text-ink"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Moon className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </header>
          )}
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 min-w-0">
            {children}
          </main>
          <footer className="border-t border-hairline px-4 sm:px-6 py-4 text-[11px] sm:text-xs text-ink-faint flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-1 text-center sm:text-left">
            <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
            <span>{t("footer.tagline")}</span>
          </footer>
        </div>
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
