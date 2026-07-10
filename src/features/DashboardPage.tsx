import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Briefcase,
  Activity,
  Trophy,
  XCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CheckCircle2,
  BellRing,
  TrendingUp,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { StatusBadge, PriorityBadge } from "@/components/common/badges";
import { listApplications, listTasks, listEvents } from "@/services";
import {
  APP_ACTIVE_STATUSES,
  APP_STATUS_LABELS,
  APP_STATUS_ORDER,
} from "@/constants";
import { formatDate, formatRelative } from "@/lib/format";
import type { AppStatus } from "@/types";
import { format, isToday, isTomorrow, isThisWeek, parseISO, startOfMonth, subMonths } from "date-fns";

import { useTranslation } from "react-i18next";

export function DashboardPage() {
  const { t } = useTranslation();
  
  useEffect(() => {
    if (sessionStorage.getItem("show_login_success") === "true") {
      toast.success("Selamat datang kembali! Anda telah berhasil masuk.");
      sessionStorage.removeItem("show_login_success");
    }
  }, []);

  const apps = useQuery({ queryKey: ["applications"], queryFn: listApplications });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: listTasks });
  const events = useQuery({ queryKey: ["events"], queryFn: listEvents });

  const applications = apps.data ?? [];
  const total = applications.length;
  const active = applications.filter((a) => APP_ACTIVE_STATUSES.includes(a.status)).length;
  const interviews = applications.filter((a) =>
    ["user_interview", "hr_interview", "final_interview", "technical_test"].includes(a.status),
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const wishlist = applications.filter((a) => a.status === "wishlist").length;
  const responded = applications.filter(
    (a) => !["wishlist", "applied"].includes(a.status),
  ).length;
  const responseRate =
    total > 0 ? Math.round((responded / (total - wishlist || 1)) * 100) : 0;

  // Monthly trend (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = startOfMonth(subMonths(now, 5 - i));
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
  const monthly = months.map((m) => ({
    month: m.label,
    count: applications.filter((a) =>
      a.applied_at ? format(parseISO(a.applied_at), "yyyy-MM") === m.key : false,
    ).length,
  }));

  // By platform
  const platformCounts = new Map<string, number>();
  for (const a of applications) {
    const p = a.platform ?? "Other";
    platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1);
  }
  const byPlatform = Array.from(platformCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Funnel
  const funnel = ["applied", "hr_screening", "user_interview", "final_interview", "offer", "accepted"].map(
    (s) => ({
      stage: APP_STATUS_LABELS[s as AppStatus],
      count: applications.filter((a) => APP_STATUS_ORDER.indexOf(a.status) >= APP_STATUS_ORDER.indexOf(s as AppStatus)).length,
    }),
  );

  const STICKER_HEX = [
    "oklch(0.58 0.16 246)",
    "oklch(0.62 0.09 190)",
    "oklch(0.66 0.18 45)",
    "oklch(0.82 0.09 305)",
    "oklch(0.7 0.16 145)",
    "oklch(0.75 0.19 5)",
    "oklch(0.75 0.11 240)",
    "oklch(0.42 0.06 55)",
  ];

  const upcomingInterviews = (events.data ?? [])
    .filter((e) => e.kind === "interview" && parseISO(e.starts_at) >= new Date())
    .slice(0, 5);
  const upcomingDeadlines = applications
    .filter((a) => a.deadline && new Date(a.deadline) >= new Date())
    .sort((a, b) => (a.deadline! > b.deadline! ? 1 : -1))
    .slice(0, 5);
  const todaysTasks = (tasks.data ?? [])
    .filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "cancelled" &&
        t.due_at &&
        (isToday(parseISO(t.due_at)) || isTomorrow(parseISO(t.due_at)) || isThisWeek(parseISO(t.due_at))),
    )
    .slice(0, 6);

  return (
    <AppShell>
      <PageHeader
        title={t("dashboard.welcome")}
        description={t("dashboard.description")}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3">
        <StatCard label={t("dashboard.totalApplications")} value={total} icon={<Briefcase className="h-4 w-4" />} hint={t("dashboard.inWishlist", { count: wishlist })} />
        <StatCard label={t("dashboard.activeProcess")} value={active} icon={<Activity className="h-4 w-4" />} hint={t("dashboard.inProgress")} />
        <StatCard label={t("dashboard.interviews")} value={interviews} icon={<Sparkles className="h-4 w-4" />} hint={t("dashboard.thisMonthUpcoming")} />
        <StatCard label={t("dashboard.offers")} value={offers} icon={<Trophy className="h-4 w-4" />} hint={t("dashboard.acceptedHint", { count: accepted })} />
        <StatCard label={t("dashboard.rejected")} value={rejected} icon={<XCircle className="h-4 w-4" />} hint={t("dashboard.noResponseHint")} />
        <StatCard label={t("dashboard.responseRate")} value={`${responseRate}%`} icon={<TrendingUp className="h-4 w-4" />} trend={{ value: `${responded}/${total - wishlist}`, positive: responseRate >= 50 }} />
        <StatCard label={t("dashboard.interviewRate")} value={`${total ? Math.round((interviews / (total - wishlist || 1)) * 100) : 0}%`} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label={t("dashboard.offerRate")} value={`${total ? Math.round(((offers + accepted) / (total - wishlist || 1)) * 100) : 0}%`} icon={<Trophy className="h-4 w-4" />} hint={t("dashboard.fromActivePool")} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-lg bg-surface border border-hairline p-5 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-eyebrow text-ink-muted">{t("dashboard.appPerMonth")}</div>
              <div className="text-title text-ink mt-1">{t("dashboard.last6Months")}</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="a" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.16 246)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.58 0.16 246)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.005 85)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="oklch(0.58 0.16 246)" strokeWidth={2} fill="url(#a)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-surface border border-hairline p-5 shadow-soft"
        >
          <div className="text-eyebrow text-ink-muted">{t("dashboard.byPlatform")}</div>
          <div className="text-title text-ink mt-1 mb-3">{t("dashboard.sourcesOfLeads")}</div>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byPlatform} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {byPlatform.map((_, i) => (
                    <Cell key={i} fill={STICKER_HEX[i % STICKER_HEX.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {byPlatform.slice(0, 5).map((p, i) => (
              <li key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STICKER_HEX[i % STICKER_HEX.length] }} />
                  {p.name}
                </span>
                <span className="tabular-nums text-ink-muted">{p.value}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Funnel + widgets */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="text-eyebrow text-ink-muted">{t("dashboard.conversionFunnel")}</div>
          <div className="text-title text-ink mt-1 mb-3">{t("dashboard.whereAppsLand")}</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={funnel} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: "oklch(0.24 0.006 60)" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
                <Bar dataKey="count" fill="oklch(0.58 0.16 246)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-eyebrow text-ink-muted">{t("dashboard.upcomingInterviews")}</div>
              <div className="text-title text-ink mt-1">{t("dashboard.nextScheduled")}</div>
            </div>
            <BellRing className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("dashboard.noInterviews")}</p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingInterviews.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-md bg-primary-soft text-primary grid place-items-center text-[11px] font-semibold">
                    {format(parseISO(e.starts_at), "dd")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{e.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5">{formatDate(e.starts_at, "EEE, MMM d · HH:mm")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-eyebrow text-ink-muted">{t("dashboard.upcomingDeadlines")}</div>
              <div className="text-title text-ink mt-1">{t("dashboard.dontMiss")}</div>
            </div>
            <Clock className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("dashboard.noDeadlines")}</p>
          ) : (
            <ul className="space-y-2.5">
              {upcomingDeadlines.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <CompanyAvatar name={a.company?.name ?? "?"} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{a.position}</div>
                    <div className="text-xs text-ink-muted truncate">{a.company?.name}</div>
                  </div>
                  <span className="text-xs text-sticker-orange font-medium tabular-nums">
                    {formatDate(a.deadline, "MMM d")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent + tasks */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg bg-surface border border-hairline shadow-soft">
          <div className="flex items-center justify-between p-5 border-b border-hairline">
            <div>
              <div className="text-eyebrow text-ink-muted">{t("dashboard.recentApplications")}</div>
              <div className="text-title text-ink mt-1">{t("dashboard.newestActivity")}</div>
            </div>
            <Link href="/applications" className="text-sm text-primary hover:text-primary-active transition-colors">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <ul className="divide-y divide-hairline">
            {applications.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/applications/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted/60 transition-colors"
                >
                  <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{a.position}</div>
                    <div className="text-xs text-ink-muted truncate">{a.company?.name} · {formatRelative(a.applied_at ?? a.created_at)}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-eyebrow text-ink-muted">{t("dashboard.thisWeeksTasks")}</div>
              <div className="text-title text-ink mt-1">{t("dashboard.focusPoints")}</div>
            </div>
            <CalendarDays className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
          </div>
          {todaysTasks.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("dashboard.noTasks")}</p>
          ) : (
            <ul className="space-y-2.5">
              {todaysTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <div className={`mt-1 h-4 w-4 rounded border-2 ${t.status === "done" ? "bg-sticker-green border-sticker-green" : "border-ink-faint"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{t.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                      {t.due_at && <span>{formatDate(t.due_at, "EEE, MMM d")}</span>}
                      {t.priority && <PriorityBadge priority={t.priority} />}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
