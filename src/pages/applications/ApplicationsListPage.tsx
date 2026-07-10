import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { Plus, Search, Filter, ArrowUpDown, ExternalLink, MoreVertical, Trash2, Eye, Building2, MapPin } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { StatusBadge, PriorityBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listApplications,
  listCompanies,
  createApplication,
  deleteApplication,
  listContacts,
} from "@/services";
import { formatDate, formatCurrency } from "@/lib/format";
import { APP_STATUS_LABELS, APP_STATUS_ORDER, WORK_MODE_LABELS } from "@/constants";
import type { AppStatus, WorkMode, EmploymentType, Priority, Application } from "@/types";
import { cn } from "@/lib/utils";

export function ApplicationsListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: listApplications,
  });
  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: listContacts });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AppStatus | "all">("all");
  const [mode, setMode] = useState<WorkMode | "all">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [openCreate, setOpenCreate] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({
    position: "",
    company_id: "",
    status: "wishlist" as AppStatus,
    work_mode: "" as WorkMode | "",
    employment_type: "" as EmploymentType | "",
    platform: "",
    job_url: "",
    career_url: "",
    salary_min: "",
    salary_max: "",
    currency: "IDR",
    location: "",
    deadline: "",
    priority: "" as Priority | "",
    recruiter_id: "",
    tags: "",
    notes: "",
  });

  const createMut = useMutation({
    mutationFn: () => {
      const tagsArray = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      return createApplication({
        position: form.position,
        company_id: form.company_id || null,
        status: form.status,
        work_mode: (form.work_mode || null) as WorkMode | null,
        employment_type: (form.employment_type || null) as EmploymentType | null,
        platform: form.platform || null,
        job_url: form.job_url || null,
        career_url: form.career_url || null,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        currency: form.currency || null,
        location: form.location || null,
        deadline: form.deadline || null,
        priority: (form.priority || null) as Priority | null,
        recruiter_id: form.recruiter_id || null,
        tags: tagsArray,
        notes: form.notes || null,
      } as Partial<Application>);
    },
    onSuccess: () => {
      toast.success(t("applications.created"));
      setForm({
        position: "",
        company_id: "",
        status: "wishlist" as AppStatus,
        work_mode: "" as WorkMode | "",
        employment_type: "" as EmploymentType | "",
        platform: "",
        job_url: "",
        career_url: "",
        salary_min: "",
        salary_max: "",
        currency: "IDR",
        location: "",
        deadline: "",
        priority: "" as Priority | "",
        recruiter_id: "",
        tags: "",
        notes: "",
      });
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => {
      toast.success(t("applications.deleted"));
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, status, mode]);

  const filtered = useMemo(() => {
    return data.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (mode !== "all" && a.work_mode !== mode) return false;
      if (q) {
        const term = q.toLowerCase();
        if (
          !a.position.toLowerCase().includes(term) &&
          !a.company?.name.toLowerCase().includes(term) &&
          !(a.platform ?? "").toLowerCase().includes(term)
        )
          return false;
      }
      return true;
    });
  }, [data, q, status, mode]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  return (
    <AppShell>
      <PageHeader
        title={t("applications.title")}
        description={t("applications.description")}
        count={data.length}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("applications.new")}</span>
          </button>
        }
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" strokeWidth={1.75} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("applications.searchPlaceholder")}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          />
        </div>
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as AppStatus | "all")}
          options={[
            ["all", t("applications.allStatuses")],
            ...APP_STATUS_ORDER.map((s) => [s, APP_STATUS_LABELS[s]] as const),
          ]}
        />
        <FilterSelect
          value={mode}
          onChange={(v) => setMode(v as WorkMode | "all")}
          options={[
            ["all", t("applications.allModes")],
            ["remote", t("applications.remote")],
            ["hybrid", t("applications.hybrid")],
            ["onsite", t("applications.onsite")],
          ]}
        />
      </div>

      {isLoading ? (
        <div className="rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden p-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-md shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("applications.empty")}
          description={t("applications.emptyDesc")}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
            <div className="grid grid-cols-[48px_minmax(240px,3fr)_1.2fr_1fr_1.2fr_32px] gap-4 px-5 py-3 border-b border-hairline bg-surface-muted/50 text-eyebrow text-ink-muted">
              <span>#</span>
              <span>{t("applications.positionCompany")}</span>
              <span>{t("applications.status")}</span>
              <span>{t("applications.mode")}</span>
              <span>{t("applications.jobPosting")}</span>
              <span></span>
            </div>

            <ul>
              <AnimatePresence initial={false}>
                {paginatedItems.map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.16 }}
                    className="border-b border-hairline last:border-0 relative group"
                  >
                    <Link
                      to={`/applications/${a.id}`}
                      className={cn(
                        "grid grid-cols-[48px_minmax(240px,3fr)_1.2fr_1fr_1.2fr_32px] items-center gap-4 px-5 py-3.5 hover:bg-surface-muted/50 transition-colors",
                      )}
                    >
                      <span className="text-xs font-semibold text-ink-muted tabular-nums">{(page - 1) * pageSize + i + 1}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={36} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink truncate flex items-center gap-2">
                            {a.position}
                            {a.priority && a.priority !== "medium" && <PriorityBadge priority={a.priority} />}
                          </div>
                          <div className="text-xs text-ink-muted flex items-center gap-3 mt-1 flex-wrap min-w-0">
                            {a.company?.name && (
                              <span className="flex items-center gap-1 min-w-0 truncate">
                                <Building2 className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                                <span className="truncate">{a.company.name}</span>
                              </span>
                            )}
                            {a.location && (
                              <span className="flex items-center gap-1 min-w-0 truncate">
                                <MapPin className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                                <span className="truncate">{a.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div><StatusBadge status={a.status} /></div>
                      <div className="text-sm text-ink-secondary">{a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "-"}</div>
                      <div className="text-sm">
                        {a.job_url || a.career_url ? (
                          <a
                            href={(a.job_url || a.career_url) ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-primary hover:text-primary-active hover:underline font-semibold"
                          >
                            <span>Link</span>
                            <ExternalLink className="h-3 w-3" strokeWidth={2} />
                          </a>
                        ) : (
                          <span className="text-ink-faint">-</span>
                        )}
                      </div>
                      {/* Empty cell placeholder to align with absolute dropdown menu */}
                      <div className="w-8 h-7" />
                    </Link>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md bg-surface border border-hairline text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors">
                          <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/applications/${a.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              {t("common.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmId(a.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2">
            {paginatedItems.map((a, i) => (
              <li key={a.id} className="rounded-lg bg-surface border border-hairline p-3 shadow-soft">
                <div className="flex items-start gap-3">
                  <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={36} />
                  <Link to={`/applications/${a.id}`} className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {(page - 1) * pageSize + i + 1}. {a.position}
                    </div>
                    <div className="text-xs text-ink-muted flex items-center gap-3 mt-1 flex-wrap">
                      {a.company?.name && (
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          <Building2 className="h-3 w-3 text-ink-faint shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{a.company.name}</span>
                        </span>
                      )}
                      {a.location && (
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          <MapPin className="h-3 w-3 text-ink-faint shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{a.location}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={a.status} />
                      {a.work_mode && <span className="text-[11px] text-ink-muted">· {WORK_MODE_LABELS[a.work_mode]}</span>}
                      {a.applied_at && <span className="text-[11px] text-ink-faint">· {formatDate(a.applied_at, "MMM d")}</span>}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md border border-hairline text-ink-faint">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setConfirmId(a.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 border-t border-hairline pt-4">
              <div className="text-xs text-ink-muted">
                Menampilkan {startIndex + 1} - {endIndex} dari {totalItems} lamaran
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-md border border-hairline text-xs font-semibold hover:bg-surface-muted transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-ink bg-surface"
                >
                  {t("calendar.previous")}
                </button>
                <div className="text-xs font-medium text-ink">
                  Halaman {page} dari {totalPages}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-md border border-hairline text-xs font-semibold hover:bg-surface-muted transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-ink bg-surface"
                >
                  {t("calendar.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("applications.new")}
        submitLabel={t("common.create")}
        onSubmit={async () => {
          if (!form.position.trim()) { toast.error(t("common.required")); return; }
          await createMut.mutateAsync();
        }}
        className="max-w-2xl sm:max-w-3xl"
      >
        <div className="max-h-[70vh] overflow-y-auto px-1.5 py-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.position")}</label>
              <input
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder={t("applications.form.positionPlaceholder")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.company")}</label>
              <select
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                className={inputCls}
              >
                <option value="">{t("applications.form.companyPlaceholder")}</option>
                {(companies.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.status")}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AppStatus })}
                className={inputCls}
              >
                {APP_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.priority")}</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority | "" })}
                className={inputCls}
              >
                <option value="">{t("applications.form.selectPriority")}</option>
                <option value="high">{t("applications.form.priorityHigh")}</option>
                <option value="medium">{t("applications.form.priorityMedium")}</option>
                <option value="low">{t("applications.form.priorityLow")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.mode")}</label>
              <select
                value={form.work_mode}
                onChange={(e) => setForm({ ...form, work_mode: e.target.value as WorkMode | "" })}
                className={inputCls}
              >
                <option value="">{t("applications.form.selectMode")}</option>
                <option value="remote">{t("applications.remote")}</option>
                <option value="hybrid">{t("applications.hybrid")}</option>
                <option value="onsite">{t("applications.onsite")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.jobType")}</label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value as EmploymentType | "" })}
                className={inputCls}
              >
                <option value="">{t("applications.form.selectJobType")}</option>
                <option value="full_time">{t("applications.form.jobTypeFullTime")}</option>
                <option value="part_time">{t("applications.form.jobTypePartTime")}</option>
                <option value="contract">{t("applications.form.jobTypeContract")}</option>
                <option value="internship">{t("applications.form.jobTypeInternship")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.location")}</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t("applications.form.locationPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.salaryMin")}</label>
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                placeholder={t("applications.form.salaryMinPlaceholder")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.salaryMax")}</label>
              <input
                type="number"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                placeholder={t("applications.form.salaryMaxPlaceholder")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.currency")}</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inputCls}
              >
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.platform")}</label>
              <input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder={t("applications.form.platformPlaceholder")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.deadline")}</label>
              <input
                type="date"
                value={form.deadline ? form.deadline.split("T")[0] : ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.jobUrl")}</label>
              <input
                type="url"
                value={form.job_url}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                placeholder={t("applications.form.jobUrlPlaceholder")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.careerUrl")}</label>
              <input
                type="url"
                value={form.career_url}
                onChange={(e) => setForm({ ...form, career_url: e.target.value })}
                placeholder={t("applications.form.careerUrlPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.recruiter")}</label>
              <select
                value={form.recruiter_id}
                onChange={(e) => setForm({ ...form, recruiter_id: e.target.value })}
                className={inputCls}
              >
                <option value="">{t("applications.form.recruiterPlaceholder")}</option>
                {(contacts.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role || "Contact"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.tags")}</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder={t("applications.form.tagsPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("applications.form.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t("applications.form.notesPlaceholder")}
              className={`${inputCls} h-20 py-2 resize-none`}
            />
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        loading={deleteMut.isPending}
        onConfirm={() => { if (confirmId) deleteMut.mutate(confirmId); }}
      />
    </AppShell>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors";

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (readonly [string, string])[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-8 pr-8 rounded-md bg-surface border border-hairline text-sm text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors appearance-none cursor-pointer"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint pointer-events-none" strokeWidth={1.75} />
      <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-faint pointer-events-none" strokeWidth={1.75} />
    </div>
  );
}
