import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar, Legend } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { listApplications } from "@/services";
import { APP_STATUS_ORDER, APP_STATUS_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/constants";
import type { AppStatus } from "@/types";

const HEX = [
  "oklch(0.58 0.16 246)",
  "oklch(0.62 0.09 190)",
  "oklch(0.66 0.18 45)",
  "oklch(0.82 0.09 305)",
  "oklch(0.7 0.16 145)",
  "oklch(0.75 0.19 5)",
  "oklch(0.75 0.11 240)",
  "oklch(0.42 0.06 55)",
];

import { useTranslation } from "react-i18next";

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data = [] } = useQuery({ queryKey: ["applications"], queryFn: listApplications });

  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = startOfMonth(subMonths(now, 5 - i));
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
  const monthly = months.map((m) => ({ month: m.label, count: data.filter((a) => a.applied_at && format(parseISO(a.applied_at), "yyyy-MM") === m.key).length }));

  const platformCounts = groupBy(data, (a) => a.platform ?? "Other");
  const roleCounts = groupBy(data, (a) => normalizeRole(a.position));
  const modeCounts = groupBy(data, (a) => (a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "-"));
  const typeCounts = groupBy(data, (a) => (a.employment_type ? EMPLOYMENT_TYPE_LABELS[a.employment_type] : "-"));
  const locationCounts = groupBy(data, (a) => a.location ?? "-");

  const funnel = ["applied", "hr_screening", "user_interview", "final_interview", "offer", "accepted"].map((s) => ({
    stage: APP_STATUS_LABELS[s as AppStatus],
    count: data.filter((a) => APP_STATUS_ORDER.indexOf(a.status) >= APP_STATUS_ORDER.indexOf(s as AppStatus)).length,
  }));

  const rates = [
    { name: t("analytics.rateResponse"), value: pct(data.filter((a) => !["wishlist", "applied"].includes(a.status)).length, data.filter((a) => a.status !== "wishlist").length), fill: HEX[0] },
    { name: t("analytics.rateInterview"), value: pct(data.filter((a) => ["user_interview","hr_interview","final_interview","technical_test"].includes(a.status)).length, data.filter((a) => a.status !== "wishlist").length), fill: HEX[1] },
    { name: t("analytics.rateOffer"), value: pct(data.filter((a) => ["offer","accepted"].includes(a.status)).length, data.filter((a) => a.status !== "wishlist").length), fill: HEX[4] },
    { name: t("analytics.rateRejected"), value: pct(data.filter((a) => a.status === "rejected").length, data.filter((a) => a.status !== "wishlist").length), fill: HEX[5] },
  ];

  return (
    <AppShell>
      <PageHeader title={t("analytics.title")} description={t("analytics.description")} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("analytics.appPerMonth")} subtitle={t("analytics.last6Months")}>
          <ResponsiveContainer>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={HEX[0]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={HEX[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.92 0.005 85)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke={HEX[0]} strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.conversionFunnel")} subtitle={t("analytics.cumulativeReach")}>
          <ResponsiveContainer>
            <BarChart data={funnel} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: "oklch(0.24 0.006 60)" }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Bar dataKey="count" fill={HEX[0]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.byPlatform")} subtitle={t("analytics.whereLeadsComeFrom")}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={toChart(platformCounts)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95} paddingAngle={2}>
                {toChart(platformCounts).map((_, i) => (<Cell key={i} fill={HEX[i % HEX.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.byRole")} subtitle={t("analytics.mostAppliedPositions")}>
          <ResponsiveContainer>
            <BarChart data={toChart(roleCounts).slice(0, 8)}>
              <CartesianGrid stroke="oklch(0.92 0.005 85)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Bar dataKey="value" fill={HEX[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.workMode")} subtitle={t("analytics.workModeDetails")}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={toChart(modeCounts)} dataKey="value" nameKey="name" outerRadius={95}>
                {toChart(modeCounts).map((_, i) => (<Cell key={i} fill={HEX[i % HEX.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.employmentType")} subtitle={t("analytics.employmentTypeDetails")}>
          <ResponsiveContainer>
            <BarChart data={toChart(typeCounts)}>
              <CartesianGrid stroke="oklch(0.92 0.005 85)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Bar dataKey="value" fill={HEX[3]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.rates")} subtitle={t("analytics.ratesDetails")}>
          <ResponsiveContainer>
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={rates} startAngle={90} endAngle={-270}>
              <RadialBar background dataKey="value" cornerRadius={8} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} formatter={(v: number) => `${v}%`} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t("analytics.byLocation")} subtitle={t("analytics.whereApplying")}>
          <ResponsiveContainer>
            <BarChart data={toChart(locationCounts).slice(0, 8)}>
              <CartesianGrid stroke="oklch(0.92 0.005 85)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "oklch(0.48 0.008 60)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.005 85)", fontSize: 12 }} />
              <Bar dataKey="value" fill={HEX[4]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
      <div className="text-eyebrow text-ink-muted">{title}</div>
      {subtitle && <div className="text-title text-ink mt-1 mb-3">{subtitle}</div>}
      <div className="h-64">{children}</div>
    </div>
  );
}

function groupBy<T>(arr: T[], key: (x: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
function toChart(m: Map<string, number>) {
  return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}
function normalizeRole(pos: string): string {
  const p = pos.toLowerCase();
  if (p.includes("frontend")) return "Frontend";
  if (p.includes("backend")) return "Backend";
  if (p.includes("full stack") || p.includes("fullstack") || p.includes("full-stack")) return "Full Stack";
  if (p.includes("mobile") || p.includes("ios") || p.includes("android")) return "Mobile";
  if (p.includes("data")) return "Data";
  if (p.includes("ml") || p.includes("machine learning") || p.includes("ai")) return "ML/AI";
  if (p.includes("devops") || p.includes("sre") || p.includes("platform")) return "DevOps/Platform";
  if (p.includes("design")) return "Design";
  if (p.includes("product manager") || p.includes("pm")) return "PM";
  if (p.includes("qa")) return "QA";
  return "Other";
}
