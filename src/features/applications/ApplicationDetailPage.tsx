"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, ExternalLink, MapPin, Calendar, DollarSign, Building2, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { StatusBadge, PriorityBadge } from "@/components/common/badges";
import { StickerBadge } from "@/components/common/StickerBadge";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  getApplication,
  listTimeline,
  listChecklist,
  listActivities,
  updateApplication,
  deleteApplication,
  listCompanies,
  listContacts,
} from "@/services";
import {
  APP_STATUS_LABELS,
  APP_STATUS_ORDER,
  APP_STATUS_STICKER,
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from "@/constants";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import type { AppStatus, WorkMode, EmploymentType, Priority, Application } from "@/types";

export function ApplicationDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();

  const app = useQuery({ queryKey: ["application", id], queryFn: () => getApplication(id), enabled: !!id });
  const timeline = useQuery({ queryKey: ["timeline", id], queryFn: () => listTimeline(id), enabled: !!id });
  const checklist = useQuery({ queryKey: ["checklist", id], queryFn: () => listChecklist(id), enabled: !!id });
  const activities = useQuery({ queryKey: ["activities", id], queryFn: () => listActivities(id), enabled: !!id });

  const companies = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: listContacts });

  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Edit Form State
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

  // Pre-populate form when dialog opens
  useEffect(() => {
    if (app.data && openEdit) {
      const a = app.data;
      setForm({
        position: a.position || "",
        company_id: a.company_id || "",
        status: a.status || "wishlist",
        work_mode: a.work_mode || "",
        employment_type: a.employment_type || "",
        platform: a.platform || "",
        job_url: a.job_url || "",
        career_url: a.career_url || "",
        salary_min: a.salary_min !== null ? String(a.salary_min) : "",
        salary_max: a.salary_max !== null ? String(a.salary_max) : "",
        currency: a.currency || "IDR",
        location: a.location || "",
        deadline: a.deadline || "",
        priority: a.priority || "",
        recruiter_id: a.recruiter_id || "",
        tags: a.tags ? a.tags.join(", ") : "",
        notes: a.notes || "",
      });
    }
  }, [app.data, openEdit]);

  const updateMut = useMutation({
    mutationFn: (patch: Partial<Application>) => updateApplication(id, patch),
    onSuccess: () => {
      toast.success("Application updated successfully");
      setOpenEdit(false);
      void qc.invalidateQueries({ queryKey: ["application", id] });
      void qc.invalidateQueries({ queryKey: ["applications"] });
      void qc.invalidateQueries({ queryKey: ["timeline", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteApplication(id),
    onSuccess: () => {
      toast.success("Application deleted successfully");
      router.push("/applications");
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleUpdateSubmit = async () => {
    if (!form.position.trim()) {
      toast.error("Position is required");
      return;
    }
    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await updateMut.mutateAsync({
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
    });
  };

  if (app.isLoading) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="h-8 w-1/3 shimmer rounded-md" />
          <div className="h-4 w-1/4 shimmer rounded-md" />
          <div className="mt-6 h-64 shimmer rounded-lg" />
        </div>
      </AppShell>
    );
  }

  const a = app.data;
  if (!a) {
    return (
      <AppShell>
        <p className="text-ink-muted">Application not found. <Link href="/applications" className="text-primary underline">Back to list</Link></p>
      </AppShell>
    );
  }

  const inputCls =
    "w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          {t("applications.backToList")}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenEdit(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-hairline hover:bg-surface-muted text-xs font-semibold text-ink transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            {t("common.edit")}
          </button>
          <button
            onClick={() => setOpenDelete(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-hairline text-destructive hover:bg-destructive/5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            {t("common.delete")}
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg bg-surface border border-hairline p-6 shadow-soft"
      >
        <div className="flex items-start gap-4">
          <CompanyAvatar name={a.company?.name ?? a.position} logoUrl={a.company?.logo_url} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-h2 text-ink">{a.position}</h1>
              <StatusBadge status={a.status} size="md" />
              {a.priority && <PriorityBadge priority={a.priority} size="md" />}
            </div>
            <div className="mt-1 text-sm text-ink-muted flex items-center gap-4 flex-wrap">
              {a.company?.name && (
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />{a.company.name}</span>
              )}
              {a.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{a.location}</span>}
              {a.applied_at && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />{t("applications.appliedLabel", { date: formatDate(a.applied_at) })}</span>}
            </div>
          </div>
          {a.job_url && (
            <a href={a.job_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-hairline hover:bg-surface-muted text-sm text-ink-secondary transition-colors cursor-pointer">
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              {t("applications.jobPosting")}
            </a>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaField label={t("applications.form.mode")} value={a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "-"} />
          <MetaField label={t("applications.form.jobType")} value={a.employment_type ? EMPLOYMENT_TYPE_LABELS[a.employment_type] : "-"} />
          <MetaField label={t("applications.salary")} value={formatCurrency(a.salary_min, a.salary_max, a.currency)} icon={<DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} />} />
          <MetaField label={t("applications.form.deadline")} value={formatDate(a.deadline)} />
          <MetaField label={t("applications.form.platform")} value={a.platform ?? "-"} />
          <MetaField label={t("applications.form.recruiter")} value={a.recruiter?.name ?? "-"} />
          <MetaField
            label={t("applications.form.careerUrl")}
            value={
              a.career_url ? (
                <a
                  href={a.career_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:text-primary-active hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  {t("applications.linked")}
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              ) : "-"
            }
          />
          <MetaField label={t("applications.form.tags")} value={
            a.tags && a.tags.length ? (
              <span className="flex flex-wrap gap-1">
                {a.tags.map((t) => (<StickerBadge key={t} color="muted" dot={false} size="sm">#{t}</StickerBadge>))}
              </span>
            ) : "-"
          } />
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="text-eyebrow text-ink-muted">{t("applications.timeline.title")}</div>
          <div className="text-title text-ink mt-1 mb-4">{t("applications.timeline.subtitle")}</div>
          <ol className="relative pl-1">
            {(() => {
              const SEQUENTIAL_STAGES: AppStatus[] = [
                "wishlist",
                "applied",
                "hr_screening",
                "technical_test",
                "user_interview",
                "hr_interview",
                "final_interview",
                "offer",
              ];
              const isTerminal = !SEQUENTIAL_STAGES.includes(a.status);
              const stagesToRender = isTerminal ? [...SEQUENTIAL_STAGES, a.status] : SEQUENTIAL_STAGES;

              return stagesToRender.map((stage, stageIdx) => {
                const entry = (timeline.data ?? []).find((t) => t.stage === stage);
                const isLast = stageIdx === stagesToRender.length - 1;
                const currentIdx = stagesToRender.indexOf(a.status);
                const isPastStage = currentIdx !== -1 && stageIdx < currentIdx;

                // Determine state: completed, active (current progress), rejected (stopped), future (skipped/pending)
                const state =
                  stage === a.status
                    ? a.status === "rejected" || a.status === "withdrawn"
                      ? "rejected"
                      : a.status === "accepted"
                      ? "completed"
                      : "active"
                    : entry || isPastStage
                    ? "completed"
                    : "future";

                // Line logic: Green if connecting two completed/active stages, otherwise grey
                const nextStage = stagesToRender[stageIdx + 1];
                const nextStageIdx = stageIdx + 1;
                const nextIsActiveOrCompleted = nextStage && (nextStageIdx <= currentIdx || !!nextStage);
                const lineIsGreen = state === "completed" && nextIsActiveOrCompleted;

                return (
                  <li key={stage} className="relative pl-6 pb-5 last:pb-0">
                    {/* Vertical connector line */}
                    {!isLast && (
                      <span
                        className={cn(
                          "absolute left-[6px] top-3 h-full w-[2px] transition-colors duration-200",
                          lineIsGreen ? "bg-success" : "bg-hairline"
                        )}
                      />
                    )}
                    {/* Dot */}
                    <span
                      className={cn(
                        "absolute left-0 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-surface flex items-center justify-center transition-all duration-200",
                        state === "active" && "bg-primary ring-primary/20",
                        state === "completed" && "bg-success ring-success/10",
                        state === "rejected" && "bg-destructive ring-destructive/20",
                        state === "future" && "bg-hairline"
                      )}
                    />
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium transition-colors",
                            state === "active" && "text-primary font-semibold",
                            state === "completed" && "text-ink font-semibold",
                            state === "rejected" && "text-destructive font-semibold",
                            state === "future" && "text-ink-faint"
                          )}
                        >
                          {APP_STATUS_LABELS[stage]}
                        </div>
                        {entry?.notes && !entry.notes.startsWith("Moved to") && !entry.notes.startsWith("Pindah ke") && (
                          <div className="text-xs text-ink-muted mt-0.5 break-words">{entry.notes}</div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "text-xs tabular-nums shrink-0 transition-colors",
                          state === "active" && "text-primary font-medium",
                          state === "completed" && "text-ink-secondary",
                          state === "rejected" && "text-destructive font-medium",
                          state === "future" && "text-ink-faint"
                        )}
                      >
                        {entry
                          ? formatDate(entry.occurred_at)
                          : stage === a.status && a.applied_at
                          ? formatDate(a.applied_at)
                          : isPastStage
                          ? t("applications.timeline.passed")
                          : state === "completed"
                          ? t("applications.timeline.completed")
                          : t("applications.timeline.pending")}
                      </div>
                    </div>
                  </li>
                );
              });
            })()}
          </ol>
        </div>

        {/* Sidebar: Checklist + Activity */}
        <div className="space-y-4">
          <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
            <div className="text-eyebrow text-ink-muted mb-2">{t("applications.checklist.title")}</div>
            {(checklist.data ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">{t("applications.checklist.empty")}</p>
            ) : (
              <ul className="space-y-2">
                {checklist.data!.map((c) => (
                  <li key={c.id} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 grid place-items-center ${c.done ? "bg-sticker-green border-sticker-green" : "border-ink-faint"}`}>
                      {c.done && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" /></svg>}
                    </div>
                    <span className={`text-sm ${c.done ? "text-ink-muted line-through" : "text-ink-secondary"}`}>{c.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
            <div className="text-eyebrow text-ink-muted mb-2">{t("applications.activity.title")}</div>
            <ul className="space-y-2">
              {(activities.data ?? []).slice(0, 8).map((act) => (
                <li key={act.id} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-sticker-${APP_STATUS_STICKER[a.status]}`} />
                  <div>
                    <div className="text-ink-secondary">{act.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-ink-faint">{formatRelative(act.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {a.notes && (
        <div className="mt-4 rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="text-eyebrow text-ink-muted mb-2">{t("applications.form.notes")}</div>
          <p className="text-sm text-ink-secondary whitespace-pre-wrap">{a.notes}</p>
        </div>
      )}

      {/* Edit Form Dialog */}
      <FormDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        title={t("applications.form.editTitle")}
        onSubmit={handleUpdateSubmit}
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
              className="w-full h-20 rounded-md border border-hairline bg-surface p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder={t("applications.form.notesPlaceholder")}
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        loading={deleteMut.isPending}
        onConfirm={async () => {
          await deleteMut.mutateAsync();
        }}
      />
    </AppShell>
  );
}

function MetaField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-eyebrow text-ink-muted flex items-center gap-1">{icon}{label}</div>
      <div className="mt-1 text-sm text-ink-secondary">{value}</div>
    </div>
  );
}
