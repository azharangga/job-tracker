import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sun, Moon, Command, PanelLeftOpen, PanelLeftClose, Settings, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import { LanguageSwitcher } from "./LanguageSwitcher";

const CRUMB_KEYS: Record<string, string> = {
  "": "nav.dashboard",
  applications: "nav.applications",
  kanban: "nav.kanban",
  calendar: "nav.calendar",
  companies: "nav.companies",
  contacts: "nav.contacts",
  documents: "nav.documents",
  tasks: "nav.tasks",
  notes: "nav.notes",
  analytics: "nav.analytics",
  settings: "nav.settings",
};

export function Topbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const { open } = useCommandPalette();
  const { user, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    };
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  const segments = (pathname || "/").split("/").filter(Boolean);
  const crumbs =
    segments.length === 0
      ? [{ label: t("nav.dashboard"), to: "/" }]
      : segments.map((seg, i) => {
          const isUuid = seg.length === 36 && seg.includes("-");
          let label = CRUMB_KEYS[seg] ? t(CRUMB_KEYS[seg]) : seg.replace(/-/g, " ");
          if (isUuid) {
            const parentSeg = segments[i - 1];
            if (parentSeg === "applications") {
              label = t("nav.detailApplication");
            } else if (parentSeg === "companies") {
              label = t("nav.detailCompany");
            } else {
              label = t("nav.detail");
            }
          }
          return {
            label,
            to: "/" + segments.slice(0, i + 1).join("/"),
          };
        });

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 border-b border-hairline bg-background/85 backdrop-blur">
      <MobileNav />

      {/* Desktop Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="hidden lg:grid h-8 w-8 place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted transition-colors text-ink-muted hover:text-ink shrink-0"
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>

      {/* Breadcrumbs (visible on both mobile and desktop next to toggle) */}
      <nav className="flex items-center gap-1.5 text-sm text-ink-muted min-w-0 flex-1 sm:flex-none overflow-hidden ml-1">
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-ink-faint">/</span>}
            <Link
              href={c.to}
              className={cn(
                "hover:text-ink transition-colors capitalize truncate",
                i === crumbs.length - 1 && "text-ink font-medium",
              )}
            >
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      <div className="hidden sm:block flex-1" />

      <button
        onClick={open}
        aria-label={t("topbar.searchPlaceholder")}
        className="hidden md:flex group items-center gap-2 px-3 py-1.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted transition-colors text-sm text-ink-muted min-w-[220px] max-w-[280px]"
      >
        <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left truncate">{t("topbar.searchPlaceholder")}</span>
        <kbd className="flex items-center gap-0.5 rounded border border-hairline bg-background px-1.5 py-0.5 text-[10px] font-medium text-ink-faint shrink-0">
          <Command className="h-3 w-3" strokeWidth={2} />K
        </kbd>
      </button>

      <button
        onClick={open}
        aria-label={t("common.search")}
        className="md:hidden h-9 w-9 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted transition-colors text-ink-muted hover:text-ink"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </button>

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

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none shrink-0 ml-1">
            <button className="h-8 w-8 rounded-full border border-hairline hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden flex items-center justify-center cursor-pointer">
              <CompanyAvatar name={user.name} logoUrl={user.avatar_url} size={32} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <div className="px-2 py-1.5 border-b border-hairline">
              <div className="text-sm font-medium text-ink truncate">{user.name}</div>
              <div className="text-[11px] text-ink-faint truncate">{user.email}</div>
            </div>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex w-full items-center gap-2 cursor-pointer mt-1"
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                <span>{t("nav.settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void logout();
              }}
              className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span>{t("nav.signOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
