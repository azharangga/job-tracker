"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { Plus, Search, Filter, ArrowUpDown, ExternalLink, MoreVertical, Trash2, Eye, Building2, MapPin, Pencil } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { StatusBadge, PriorityBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApplicationFormFields } from "@/features/applications/ApplicationFormFields";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listApplications,
  listCompanies,
  createApplication,
  updateApplication,
  deleteApplication,
  listContacts,
} from "@/services";
import { formatDate } from "@/lib/format";
import { DataPagination } from "@/components/common/DataPagination";
import { TruncateWithTooltip } from "@/components/common/TruncateWithTooltip";
import { APP_STATUS_LABELS, APP_STATUS_ORDER, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/constants";
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
  const [pageSize, setPageSize] = useState(10);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    applied_at: "",
    deadline: "",
    priority: "" as Priority | "",
    recruiter_id: "",
    tags: "",
    notes: "",
    rejected_at_stage: "" as AppStatus | "",
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
        rejected_at_stage: form.status === "rejected" ? (form.rejected_at_stage || "applied") as AppStatus : null,
        work_mode: (form.work_mode || null) as WorkMode | null,
        employment_type: (form.employment_type || null) as EmploymentType | null,
        platform: form.platform || null,
        job_url: form.job_url || null,
        career_url: form.career_url || null,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        currency: form.currency || null,
        location: form.location || null,
        applied_at: form.applied_at || null,
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
        applied_at: "",
        deadline: "",
        priority: "" as Priority | "",
        recruiter_id: "",
        tags: "",
        notes: "",
        rejected_at_stage: "" as AppStatus | "",
      });
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("No application selected");
      const tagsArray = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      return updateApplication(editingId, {
        position: form.position,
        company_id: form.company_id || null,
        status: form.status,
        rejected_at_stage: form.status === "rejected" ? (form.rejected_at_stage || "applied") as AppStatus : null,
        work_mode: (form.work_mode || null) as WorkMode | null,
        employment_type: (form.employment_type || null) as EmploymentType | null,
        platform: form.platform || null,
        job_url: form.job_url || null,
        career_url: form.career_url || null,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        currency: form.currency || null,
        location: form.location || null,
        applied_at: form.applied_at || null,
        deadline: form.deadline || null,
        priority: (form.priority || null) as Priority | null,
        recruiter_id: form.recruiter_id || null,
        tags: tagsArray,
        notes: form.notes || null,
      } as Partial<Application>);
    },
    onSuccess: () => {
      toast.success(t("common.save"));
      setOpenEdit(false);
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleStartEdit = (a: Application) => {
    setEditingId(a.id);
    setForm({
      position: a.position || "",
      company_id: a.company_id || "",
      status: a.status || "wishlist",
      work_mode: a.work_mode || "",
      employment_type: a.employment_type || "",
      platform: a.platform || "",
      job_url: a.job_url || "",
      career_url: a.career_url || "",
      salary_min: a.salary_min !== null && a.salary_min !== undefined ? String(a.salary_min) : "",
      salary_max: a.salary_max !== null && a.salary_max !== undefined ? String(a.salary_max) : "",
      currency: a.currency || "IDR",
      location: a.location || "",
      applied_at: a.applied_at || "",
      deadline: a.deadline || "",
      priority: a.priority || "",
      recruiter_id: a.recruiter_id || "",
      tags: a.tags ? a.tags.join(", ") : "",
      notes: a.notes || "",
      rejected_at_stage: a.rejected_at_stage || "",
    });
    setOpenEdit(true);
  };

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
          !a.company?.name?.toLowerCase().includes(term) &&
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
            onClick={() => {
              setForm({
                position: "", company_id: "", status: "wishlist", work_mode: "", employment_type: "", platform: "", job_url: "", career_url: "", salary_min: "", salary_max: "", currency: "IDR", location: "", applied_at: "", deadline: "", priority: "", recruiter_id: "", tags: "", notes: "", rejected_at_stage: "",
              });
              setOpenCreate(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer shadow-soft"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("applications.new")}</span>
          </button>
        }
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint pointer-events-none" strokeWidth={1.75} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("applications.searchPlaceholder")}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
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
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[1020px]">
                <div className="grid grid-cols-[48px_minmax(180px,2fr)_130px_110px_110px_120px_120px_80px_40px] gap-3 px-5 py-3 border-b border-hairline bg-surface-muted/50 text-eyebrow text-ink-muted whitespace-nowrap">
                  <span className="sticky left-0 bg-surface-muted z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] px-1">#</span>
                  <span>{t("applications.positionCompany")}</span>
                  <span>{t("applications.status")}</span>
                  <span>{t("applications.workModeHeader", { defaultValue: "WORK MODE" })}</span>
                  <span>{t("applications.jobTypeHeader", { defaultValue: "JOB TYPE" })}</span>
                  <span>{t("applications.form.appliedAt")}</span>
                  <span>{t("applications.form.deadline")}</span>
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
                          href={`/applications/${a.id}`}
                          className="grid grid-cols-[48px_minmax(180px,2fr)_130px_110px_110px_120px_120px_80px_40px] items-center gap-3 px-5 py-3.5 hover:bg-surface-muted/50 transition-colors"
                        >
                          <span className="text-xs font-semibold text-ink-muted tabular-nums truncate sticky left-0 bg-surface z-20 border-r border-hairline shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] px-1">
                            {(page - 1) * pageSize + i + 1}
                          </span>
                          <div className="flex items-center gap-3 min-w-0">
                            <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={36} />
                            <div className="min-w-0 overflow-hidden">
                              <div className="text-sm font-medium text-ink truncate flex items-center gap-2">
                                <TruncateWithTooltip text={a.position} className="text-sm font-medium text-ink" />
                                {a.priority && a.priority !== "medium" && <PriorityBadge priority={a.priority} />}
                              </div>
                              <div className="text-xs text-ink-muted flex items-center gap-3 mt-1 min-w-0 overflow-hidden">
                                {a.company?.name && (
                                  <span className="flex items-center gap-1 min-w-0 shrink truncate">
                                    <Building2 className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                                    <TruncateWithTooltip text={a.company.name} className="truncate" />
                                  </span>
                                )}
                                {a.location && (
                                  <span className="flex items-center gap-1 min-w-0 shrink truncate">
                                    <MapPin className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
                                    <TruncateWithTooltip text={a.location} className="truncate" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 overflow-hidden"><StatusBadge status={a.status} /></div>
                          <div className="text-sm text-ink-secondary truncate min-w-0">{a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "-"}</div>
                          <div className="text-sm text-ink-secondary truncate min-w-0">{a.employment_type ? EMPLOYMENT_TYPE_LABELS[a.employment_type] : "-"}</div>
                          <div className="text-sm text-ink-secondary truncate min-w-0">{a.applied_at ? formatDate(a.applied_at, "d MMM yyyy") : "-"}</div>
                          <div className="text-sm text-ink-secondary truncate min-w-0">{a.deadline ? formatDate(a.deadline, "d MMM yyyy") : "-"}</div>
                          <div className="text-sm min-w-0 truncate">
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
                          <div className="w-8 h-7" />
                        </Link>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md bg-surface border border-hairline text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors">
                          <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/applications/${a.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              {t("common.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(a)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            {t("common.edit")}
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
            </div>
            <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            <ul className="space-y-2">
              {paginatedItems.map((a, i) => (
                <li key={a.id} className="rounded-lg bg-surface border border-hairline p-3 shadow-soft">
                  <div className="flex items-start gap-3">
                    <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={36} />
                    <Link href={`/applications/${a.id}`} className="flex-1 min-w-0">
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
                        {a.employment_type && <span className="text-[11px] text-ink-muted">· {EMPLOYMENT_TYPE_LABELS[a.employment_type]}</span>}
                        {a.applied_at && <span className="text-[11px] text-ink-faint">· {formatDate(a.applied_at, "d MMM")}</span>}
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md border border-hairline text-ink-faint">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/applications/${a.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              {t("common.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(a)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            {t("common.edit")}
                          </DropdownMenuItem>
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
            <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>
        </>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={(open) => {
          if (!open) {
            setForm({
              position: "", company_id: "", status: "wishlist", work_mode: "", employment_type: "", platform: "", job_url: "", career_url: "", salary_min: "", salary_max: "", currency: "IDR", location: "", applied_at: "", deadline: "", priority: "", recruiter_id: "", tags: "", notes: "", rejected_at_stage: "",
            });
          }
          setOpenCreate(open);
        }}
        title={t("applications.new")}
        submitLabel={t("common.create")}
        onSubmit={async () => {
          if (!form.position.trim()) { toast.error(t("common.required")); return; }
          await createMut.mutateAsync();
        }}
        className="max-w-2xl sm:max-w-4xl"
      >
        <ApplicationFormFields
          form={form}
          setForm={setForm}
          companies={companies.data ?? []}
          contacts={contacts.data ?? []}
          showDetailsTextareas={false}
        />
      </FormDialog>

      <FormDialog
        open={openEdit}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
          setOpenEdit(open);
        }}
        title={t("applications.form.editTitle")}
        submitLabel={t("common.save")}
        onSubmit={async () => {
          if (!form.position.trim()) { toast.error(t("common.required")); return; }
          await updateMut.mutateAsync();
        }}
        className="max-w-2xl sm:max-w-4xl"
      >
        <ApplicationFormFields
          form={form}
          setForm={setForm}
          companies={companies.data ?? []}
          contacts={contacts.data ?? []}
          showDetailsTextareas={false}
        />
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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-md bg-surface border border-hairline text-sm text-ink hover:bg-surface-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-ink-faint shrink-0" strokeWidth={1.75} />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
