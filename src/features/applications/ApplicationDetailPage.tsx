"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft, ExternalLink, MapPin, Calendar, DollarSign, Building2, Pencil, Trash2, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { StatusBadge, PriorityBadge } from "@/components/common/badges";
import { StickerBadge } from "@/components/common/StickerBadge";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApplicationFormFields } from "@/features/applications/ApplicationFormFields";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Inline edit state
  const [editingJobReq, setEditingJobReq] = useState(false);
  const [jobReqDraft, setJobReqDraft] = useState("");
  const [editingJobDesc, setEditingJobDesc] = useState(false);
  const [jobDescDraft, setJobDescDraft] = useState("");

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
    job_requirements: "",
    job_description: "",
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
        job_requirements: a.job_requirements || "",
        job_description: a.job_description || "",
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
      job_requirements: form.job_requirements || null,
      job_description: form.job_description || null,
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
            {a.tags && a.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 items-center">
                {a.tags.map((tg) => (
                  <StickerBadge key={tg} color="muted" dot={false} size="sm">
                    #{tg}
                  </StickerBadge>
                ))}
              </div>
            )}
          </div>
          {a.job_url && (
            <a href={a.job_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-hairline hover:bg-surface-muted text-sm text-ink-secondary transition-colors cursor-pointer">
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              {t("applications.jobPosting")}
            </a>
          )}
        </div>

        {(() => {
          const isDeadlinePassed = a.deadline
            ? new Date(a.deadline).getTime() < new Date().setHours(0, 0, 0, 0)
            : false;
          const isOpen = !isDeadlinePassed;

          return (
            <div className="mt-5 pt-4 border-t border-hairline/60 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
              {/* Row 1: Vacancy Status, Work Mode, Job Type, Deadline */}
              <MetaField
                label={t("applications.vacancyStatus", { defaultValue: "Status Lowongan" })}
                value={
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5",
                      isOpen
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-success" : "bg-destructive")} />
                    {isOpen ? t("applications.statusOpen", { defaultValue: "Open" }) : t("applications.statusClosed", { defaultValue: "Closed" })}
                  </span>
                }
              />
              <MetaField label={t("applications.form.mode")} value={a.work_mode ? WORK_MODE_LABELS[a.work_mode] : "-"} />
              <MetaField label={t("applications.form.jobType")} value={a.employment_type ? EMPLOYMENT_TYPE_LABELS[a.employment_type] : "-"} />
              <MetaField label={t("applications.form.deadline")} value={formatDate(a.deadline)} />

              {/* Row 2: Platform, Job URL, Career URL, Recruiter */}
              <MetaField label={t("applications.form.platform")} value={a.platform ?? "-"} />
              <MetaField
                label={t("applications.form.jobUrl")}
                value={
                  a.job_url ? (
                    <a
                      href={a.job_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary-active hover:underline inline-flex items-center gap-1 font-semibold text-sm"
                    >
                      <span>{t("applications.link", { defaultValue: "Link" })}</span>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </a>
                  ) : "-"
                }
              />
              <MetaField
                label={t("applications.form.careerUrl")}
                value={
                  a.career_url ? (
                    <a
                      href={a.career_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary-active hover:underline inline-flex items-center gap-1 font-semibold text-sm"
                    >
                      <span>{t("applications.link", { defaultValue: "Link" })}</span>
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </a>
                  ) : "-"
                }
              />
              <MetaField label={t("applications.form.recruiter")} value={a.recruiter?.name ?? "-"} />
            </div>
          );
        })()}
      </motion.div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* KIRI: Job Requirements + Job Description — atas bawah, lebar 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Job Requirements */}
          <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow text-ink-muted">{t("applications.jobRequirements.title")}</div>
              {!editingJobReq && (
                <button
                  onClick={() => { setJobReqDraft(a.job_requirements || ""); setEditingJobReq(true); }}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-surface-muted"
                >
                  <Pencil className="h-3 w-3" /> {t("applications.jobRequirements.edit")}
                </button>
              )}
            </div>
            {editingJobReq ? (
              <div className="space-y-2">
                <textarea
                  autoFocus value={jobReqDraft}
                  onChange={(e) => setJobReqDraft(e.target.value)}
                  placeholder={t("applications.jobRequirements.placeholder")}
                  className="w-full min-h-[200px] rounded-md border border-hairline bg-surface p-3 text-sm text-ink-secondary focus:outline-none focus:ring-1 focus:ring-primary resize-y leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingJobReq(false)} className="text-xs px-3 py-1.5 rounded-md border border-hairline text-ink-muted hover:bg-muted transition-colors">{t("applications.jobRequirements.cancel")}</button>
                  <button
                    onClick={async () => { await updateMut.mutateAsync({ job_requirements: jobReqDraft || null }); setEditingJobReq(false); }}
                    disabled={updateMut.isPending}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-50"
                  >{updateMut.isPending ? t("applications.jobRequirements.saving") : t("applications.jobRequirements.save")}</button>
                </div>
              </div>
            ) : a.job_requirements ? (
              <p className="text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed">{a.job_requirements}</p>
            ) : (
              <button
                onClick={() => { setJobReqDraft(""); setEditingJobReq(true); }}
                className="w-full py-10 border-2 border-dashed border-hairline rounded-lg text-sm text-ink-muted hover:border-ink-muted/50 hover:text-ink hover:bg-surface-muted/60 transition-all flex flex-col items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                <span>{t("applications.jobRequirements.add")}</span>
                <span className="text-xs">{t("applications.jobRequirements.addHint")}</span>
              </button>
            )}
          </div>

          {/* Job Description */}
          <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow text-ink-muted">{t("applications.jobDescription.title")}</div>
              {!editingJobDesc && (
                <button
                  onClick={() => { setJobDescDraft(a.job_description || ""); setEditingJobDesc(true); }}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-surface-muted"
                >
                  <Pencil className="h-3 w-3" /> {t("applications.jobDescription.edit")}
                </button>
              )}
            </div>
            {editingJobDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus value={jobDescDraft}
                  onChange={(e) => setJobDescDraft(e.target.value)}
                  placeholder={t("applications.jobDescription.placeholder")}
                  className="w-full min-h-[200px] rounded-md border border-hairline bg-surface p-3 text-sm text-ink-secondary focus:outline-none focus:ring-1 focus:ring-primary resize-y leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingJobDesc(false)} className="text-xs px-3 py-1.5 rounded-md border border-hairline text-ink-muted hover:bg-muted transition-colors">{t("applications.jobDescription.cancel")}</button>
                  <button
                    onClick={async () => { await updateMut.mutateAsync({ job_description: jobDescDraft || null }); setEditingJobDesc(false); }}
                    disabled={updateMut.isPending}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-50"
                  >{updateMut.isPending ? t("applications.jobDescription.saving") : t("applications.jobDescription.save")}</button>
                </div>
              </div>
            ) : a.job_description ? (
              <p className="text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed">{a.job_description}</p>
            ) : (
              <button
                onClick={() => { setJobDescDraft(""); setEditingJobDesc(true); }}
                className="w-full py-10 border-2 border-dashed border-hairline rounded-lg text-sm text-ink-muted hover:border-ink-muted/50 hover:text-ink hover:bg-surface-muted/60 transition-all flex flex-col items-center gap-1.5"
              >
                <Pencil className="h-4 w-4" />
                <span>{t("applications.jobDescription.add")}</span>
                <span className="text-xs">{t("applications.jobDescription.addHint")}</span>
              </button>
            )}
          </div>

        </div>
        {/* KANAN: Timeline — sempit 1/3 */}
        <div className="lg:col-span-1 rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-eyebrow text-ink-muted">{t("applications.timeline.title")}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1 rounded-md hover:bg-surface-muted cursor-pointer font-medium"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{t("applications.jobRequirements.edit", { defaultValue: "Ubah" })}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 max-h-72 overflow-y-auto">
                {(() => {
                  const REJECTABLE_STAGES: AppStatus[] = [
                    "wishlist", "applied", "hr_screening", "technical_test",
                    "hr_interview", "user_interview", "final_interview", "offer"
                  ];

                  return APP_STATUS_ORDER.map((st) => {
                    if (st === "rejected") {
                      return (
                        <DropdownMenuSub key={st}>
                          <DropdownMenuSubTrigger className="cursor-pointer text-xs justify-between py-2 px-2.5 text-destructive font-medium">
                            <span>{APP_STATUS_LABELS.rejected}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-52">
                            <div className="px-2.5 py-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                              {t("applications.form.rejectedAtStage", { defaultValue: "Ditolak Pada Tahap" })}
                            </div>
                            {REJECTABLE_STAGES.map((rejSt) => (
                              <DropdownMenuItem
                                key={rejSt}
                                onClick={() => updateMut.mutate({ status: "rejected", rejected_at_stage: rejSt })}
                                className={cn(
                                  "cursor-pointer text-xs justify-between py-1.5 px-2.5",
                                  a.status === "rejected" && (a.rejected_at_stage || "applied") === rejSt && "font-semibold text-destructive bg-destructive/5"
                                )}
                              >
                                <span>{APP_STATUS_LABELS[rejSt]}</span>
                                {a.status === "rejected" && (a.rejected_at_stage || "applied") === rejSt && (
                                  <Check className="h-3.5 w-3.5 text-destructive shrink-0" />
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    }

                    return (
                      <DropdownMenuItem
                        key={st}
                        onClick={() => updateMut.mutate({ status: st })}
                        className={cn(
                          "cursor-pointer text-xs justify-between py-2 px-2.5",
                          st === a.status && "font-semibold text-primary bg-primary/5"
                        )}
                      >
                        <span>{APP_STATUS_LABELS[st]}</span>
                        {st === a.status && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  });
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-title text-ink mt-1 mb-4">{t("applications.timeline.subtitle")}</div>
          <ol className="relative pl-1">
            {(() => {
              const ALL_STAGES: AppStatus[] = [
                "wishlist", "applied", "hr_screening", "technical_test",
                "hr_interview", "user_interview", "final_interview", "offer", "accepted"
              ];

              const stagesToRender = ALL_STAGES;

              // Find exact failed stage index if application is rejected
              let failedStageIdx = -1;
              if (a.status === "rejected") {
                if (a.rejected_at_stage) {
                  failedStageIdx = ALL_STAGES.indexOf(a.rejected_at_stage);
                }
                if (failedStageIdx === -1) {
                  const loggedStages = (timeline.data ?? []).map((t) => t.stage).filter((st) => st !== "rejected");
                  if (loggedStages.length > 0) {
                    const indices = loggedStages.map((st) => ALL_STAGES.indexOf(st)).filter((i) => i !== -1);
                    if (indices.length > 0) {
                      failedStageIdx = Math.max(...indices);
                    }
                  }
                  if (failedStageIdx <= 0) {
                    failedStageIdx = 1;
                  }
                }
              }

              const currentIdx = ALL_STAGES.indexOf(a.status);

              return stagesToRender.map((stage, stageIdx) => {
                const entry = (timeline.data ?? []).find((t) => t.stage === stage);
                const isLast = stageIdx === stagesToRender.length - 1;

                let state: "completed" | "active" | "offer" | "rejected" | "future" = "future";

                if (a.status === "rejected") {
                  if (stageIdx < failedStageIdx) {
                    state = "completed";
                  } else if (stageIdx === failedStageIdx) {
                    state = "rejected";
                  } else {
                    state = "future";
                  }
                } else {
                  if (stageIdx < currentIdx) {
                    state = "completed";
                  } else if (stageIdx === currentIdx) {
                    state = (stage === "offer" || stage === "accepted") ? "offer" : "active";
                  } else {
                    state = "future";
                  }
                }

                const lineIsGreen = state === "completed" || state === "offer";

                return (
                  <li key={stage} className="relative pl-6 pb-5 last:pb-0">
                    {!isLast && (
                      <span className={cn("absolute left-[6px] top-3 h-full w-[2px] transition-colors duration-200", lineIsGreen ? "bg-success" : "bg-hairline")} />
                    )}
                    <span className={cn(
                      "absolute left-0 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-surface flex items-center justify-center transition-all duration-200",
                      state === "active" && "bg-primary ring-primary/20",
                      (state === "completed" || state === "offer") && "bg-success ring-success/10",
                      state === "rejected" && "bg-destructive ring-destructive/20",
                      state === "future" && "bg-hairline opacity-60"
                    )} />
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className={cn(
                          "text-sm font-medium transition-colors",
                          state === "active" && "text-primary font-semibold",
                          state === "offer" && "text-success font-semibold",
                          state === "completed" && "text-ink font-semibold",
                          state === "rejected" && "text-destructive font-semibold",
                          state === "future" && "text-ink-faint"
                        )}>
                          {APP_STATUS_LABELS[stage]}
                        </div>
                        {entry?.notes && !entry.notes.startsWith("Moved to") && !entry.notes.startsWith("Pindah ke") && (
                          <div className="text-xs text-ink-muted mt-0.5 break-words">{entry.notes}</div>
                        )}
                      </div>
                      <div className={cn(
                        "text-xs tabular-nums shrink-0 transition-colors",
                        state === "active" && "text-primary font-semibold",
                        state === "offer" && "text-success font-semibold",
                        state === "completed" && "text-ink-secondary",
                        state === "rejected" && "text-destructive font-semibold",
                        state === "future" && "text-ink-faint"
                      )}>
                        {entry ? formatDate(entry.occurred_at)
                          : state === "rejected" ? t("applications.timeline.rejected", { defaultValue: "Ditolak" })
                          : stage === a.status && a.status === "offer" ? t("applications.timeline.offered", { defaultValue: "Penawaran Kerja" })
                          : stage === a.status && a.status === "accepted" ? t("applications.timeline.accepted", { defaultValue: "Diterima" })
                          : stage === a.status && a.applied_at && a.status === "applied" ? formatDate(a.applied_at)
                          : state === "active" ? t("applications.timeline.inProgress")
                          : state === "completed" ? t("applications.timeline.passed")
                          : "-"}
                      </div>
                    </div>
                  </li>
                );
              });
            })()}
          </ol>
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
        className="max-w-2xl sm:max-w-4xl"
      >
        <ApplicationFormFields
          form={form}
          setForm={setForm}
          companies={companies.data ?? []}
          contacts={contacts.data ?? []}
          showDetailsTextareas={true}
        />
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
