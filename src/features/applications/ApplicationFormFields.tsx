"use client";

import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon } from "lucide-react";
import { APP_STATUS_ORDER, APP_STATUS_LABELS } from "@/constants";
import type { Company, Contact, AppStatus, WorkMode, EmploymentType, Priority } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface ApplicationFormState {
  position: string;
  company_id: string;
  status: AppStatus;
  work_mode: WorkMode | "";
  employment_type: EmploymentType | "";
  platform: string;
  job_url: string;
  career_url: string;
  salary_min: string;
  salary_max: string;
  currency: string;
  location: string;
  deadline: string;
  priority: Priority | "";
  recruiter_id: string;
  tags: string;
  notes: string;
  rejected_at_stage?: AppStatus | "";
  job_requirements?: string;
  job_description?: string;
}

const REJECTABLE_STAGES: AppStatus[] = [
  "wishlist",
  "applied",
  "hr_screening",
  "technical_test",
  "hr_interview",
  "user_interview",
  "final_interview",
  "offer",
];

interface ApplicationFormFieldsProps<T extends ApplicationFormState> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  companies: Company[];
  contacts: Contact[];
  showDetailsTextareas?: boolean;
}

export function ApplicationFormFields<T extends ApplicationFormState>({
  form,
  setForm,
  companies,
  contacts,
  showDetailsTextareas = true,
}: ApplicationFormFieldsProps<T>) {
  const { t } = useTranslation();

  const inputCls =
    "w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  const labelCls = "block text-xs font-semibold text-ink-secondary mb-1.5";

  return (
    <div className="max-h-[65vh] overflow-y-auto pr-3 pl-0.5 space-y-4 scrollbar-thin">
      {/* Row 1: Position & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.position")}</label>
          <input
            required
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder={t("applications.form.positionPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.company")}</label>
          <Select
            value={form.company_id || "_none"}
            onValueChange={(val) => setForm({ ...form, company_id: val === "_none" ? "" : val })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={t("applications.form.companyPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{t("applications.form.companyPlaceholder")}</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Status, Priority, (and Rejected At Stage if rejected) */}
      <div className={cn("grid grid-cols-1 gap-3.5", form.status === "rejected" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <div>
          <label className={labelCls}>{t("applications.form.status")}</label>
          <Select
            value={form.status}
            onValueChange={(val) => setForm({ ...form, status: val as AppStatus })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APP_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {APP_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.status === "rejected" && (
          <div>
            <label className={labelCls}>{t("applications.form.rejectedAtStage", { defaultValue: "Ditolak Pada Tahap" })}</label>
            <Select
              value={form.rejected_at_stage || "applied"}
              onValueChange={(val) => setForm({ ...form, rejected_at_stage: val as AppStatus })}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTABLE_STAGES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {APP_STATUS_LABELS[st]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className={labelCls}>{t("applications.form.priority")}</label>
          <Select
            value={form.priority || "_none"}
            onValueChange={(val) => setForm({ ...form, priority: (val === "_none" ? "" : val) as Priority | "" })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={t("applications.form.selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{t("applications.form.selectPriority")}</SelectItem>
              <SelectItem value="high">{t("applications.form.priorityHigh")}</SelectItem>
              <SelectItem value="medium">{t("applications.form.priorityMedium")}</SelectItem>
              <SelectItem value="low">{t("applications.form.priorityLow")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Work Mode, Job Type, Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.mode")}</label>
          <Select
            value={form.work_mode || "_none"}
            onValueChange={(val) => setForm({ ...form, work_mode: (val === "_none" ? "" : val) as WorkMode | "" })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={t("applications.form.selectMode")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{t("applications.form.selectMode")}</SelectItem>
              <SelectItem value="remote">{t("applications.remote")}</SelectItem>
              <SelectItem value="hybrid">{t("applications.hybrid")}</SelectItem>
              <SelectItem value="onsite">{t("applications.onsite")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.jobType")}</label>
          <Select
            value={form.employment_type || "_none"}
            onValueChange={(val) => setForm({ ...form, employment_type: (val === "_none" ? "" : val) as EmploymentType | "" })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={t("applications.form.selectJobType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{t("applications.form.selectJobType")}</SelectItem>
              <SelectItem value="full_time">{t("applications.form.jobTypeFullTime")}</SelectItem>
              <SelectItem value="part_time">{t("applications.form.jobTypePartTime")}</SelectItem>
              <SelectItem value="contract">{t("applications.form.jobTypeContract")}</SelectItem>
              <SelectItem value="internship">{t("applications.form.jobTypeInternship")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.location")}</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder={t("applications.form.locationPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 4: Salary Min, Salary Max, Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.salaryMin")}</label>
          <input
            type="number"
            value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
            placeholder={t("applications.form.salaryMinPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.salaryMax")}</label>
          <input
            type="number"
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            placeholder={t("applications.form.salaryMaxPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.currency")}</label>
          <Select
            value={form.currency || "IDR"}
            onValueChange={(val) => setForm({ ...form, currency: val })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR (Rp)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="SGD">SGD (S$)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 5: Platform & Deadline (shadcn DatePicker) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.platform")}</label>
          <input
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            placeholder={t("applications.form.platformPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.deadline")}</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  inputCls,
                  "flex items-center justify-between text-left font-normal cursor-pointer",
                  !form.deadline && "text-ink-faint"
                )}
              >
                <span>
                  {form.deadline
                    ? formatDate(form.deadline)
                    : t("applications.form.deadlinePlaceholder", { defaultValue: "dd/mm/yyyy" })}
                </span>
                <CalendarIcon className="h-4 w-4 text-ink-faint shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.deadline ? new Date(form.deadline) : undefined}
                onSelect={(date) => {
                  setForm({
                    ...form,
                    deadline: date ? date.toISOString() : "",
                  });
                }}
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(2035, 11)}
                fixedWeeks
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 6: Job URL & Career URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.jobUrl")}</label>
          <input
            type="url"
            value={form.job_url}
            onChange={(e) => setForm({ ...form, job_url: e.target.value })}
            placeholder={t("applications.form.jobUrlPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.careerUrl")}</label>
          <input
            type="url"
            value={form.career_url}
            onChange={(e) => setForm({ ...form, career_url: e.target.value })}
            placeholder={t("applications.form.careerUrlPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 7: Recruiter & Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.recruiter")}</label>
          <Select
            value={form.recruiter_id || "_none"}
            onValueChange={(val) => setForm({ ...form, recruiter_id: val === "_none" ? "" : val })}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={t("applications.form.recruiterPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{t("applications.form.recruiterPlaceholder")}</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.role || "Contact"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.tags")}</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder={t("applications.form.tagsPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 8: Notes */}
      <div>
        <label className={labelCls}>{t("applications.form.notes")}</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder={t("applications.form.notesPlaceholder")}
          className="w-full h-20 px-3 py-2 rounded-md border border-hairline bg-surface text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y leading-relaxed"
        />
      </div>

      {/* Row 9 & 10: Job Requirements & Job Description (if enabled) */}
      {showDetailsTextareas && (
        <>
          <div>
            <label className={labelCls}>{t("applications.jobRequirements.title")}</label>
            <textarea
              value={form.job_requirements || ""}
              onChange={(e) => setForm({ ...form, job_requirements: e.target.value })}
              placeholder={t("applications.jobRequirements.placeholder")}
              className="w-full h-24 px-3 py-2 rounded-md border border-hairline bg-surface text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y leading-relaxed"
            />
          </div>

          <div>
            <label className={labelCls}>{t("applications.jobDescription.title")}</label>
            <textarea
              value={form.job_description || ""}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
              placeholder={t("applications.jobDescription.placeholder")}
              className="w-full h-24 px-3 py-2 rounded-md border border-hairline bg-surface text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-y leading-relaxed"
            />
          </div>
        </>
      )}
    </div>
  );
}
