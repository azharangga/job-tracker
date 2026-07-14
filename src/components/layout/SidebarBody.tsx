import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Calendar,
  Building2,
  Users,
  FileText,
  CheckSquare,
  StickyNote,
  BarChart3,
  Link as LinkIcon,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Logo } from "@/components/common/Logo";

type Item = { to: string; labelKey: string; icon: LucideIcon; end?: boolean };

export const NAV_ITEMS: Item[] = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/companies", labelKey: "nav.companies", icon: Building2 },
  { to: "/applications", labelKey: "nav.applications", icon: Briefcase },
  { to: "/kanban", labelKey: "nav.kanban", icon: Kanban },
  { to: "/calendar", labelKey: "nav.calendar", icon: Calendar },
  { to: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { to: "/notes", labelKey: "nav.notes", icon: StickyNote },
  { to: "/documents", labelKey: "nav.documents", icon: FileText },
  { to: "/contacts", labelKey: "nav.contacts", icon: Users },
  { to: "/shortlinks", labelKey: "nav.shortlinks", icon: LinkIcon },
  { to: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
];

export function SidebarBody({
  onNavigate,
  layoutIdSuffix = "",
  isCollapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  layoutIdSuffix?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className={cn("h-14 px-4 flex items-center border-b border-hairline shrink-0", isCollapsed ? "justify-center" : "gap-2.5")}>
        <Logo className="h-7 w-7 shrink-0" />
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-ink leading-none truncate">
              {t("app.name")}
            </span>
            <span className="text-[11px] text-ink-faint leading-tight mt-0.5 truncate">
              {t("app.tagline")}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {!isCollapsed && <div className="text-eyebrow text-ink-faint px-3 pb-1.5">{t("nav.workspace")}</div>}
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  onClick={onNavigate}
                  title={isCollapsed ? t(item.labelKey) : undefined}
                  className={cn(
                    "relative group flex items-center rounded-md text-sm transition-colors",
                    isCollapsed ? "justify-center h-9 w-9 mx-auto p-0" : "gap-2.5 px-3 py-2",
                    isActive
                      ? "bg-sidebar-accent text-ink font-medium"
                      : "text-ink-secondary hover:bg-sidebar-accent/60 hover:text-ink",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`sidebar-active${layoutIdSuffix}`}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive
                        ? "text-ink"
                        : "text-ink-muted group-hover:text-ink-secondary",
                    )}
                    strokeWidth={1.75}
                  />
                  {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {onToggle && (
        <div className="p-2 border-t border-hairline shrink-0 flex justify-center">
          <button
            onClick={onToggle}
            className="h-8 w-8 rounded-md hover:bg-sidebar-accent text-ink-faint hover:text-ink transition-colors grid place-items-center"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      )}

      {user && (
        <div className="border-t border-hairline p-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left focus:outline-none">
              <div
                title={isCollapsed ? `${user.name} (${user.email})` : undefined}
                className={cn(
                  "flex items-center rounded-md hover:bg-sidebar-accent transition-colors w-full cursor-pointer",
                  isCollapsed ? "justify-center p-1.5" : "gap-2.5 p-2",
                )}
              >
                <CompanyAvatar name={user.name} logoUrl={user.avatar_url} size={isCollapsed ? 24 : 32} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{user.name}</div>
                    <div className="text-[11px] text-ink-faint truncate">{user.email}</div>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  onClick={onNavigate}
                  className="flex w-full items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                  <span>{t("nav.settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.();
                  void logout();
                }}
                className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                <span>{t("nav.signOut")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
