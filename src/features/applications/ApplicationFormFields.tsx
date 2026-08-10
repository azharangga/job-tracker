"use client";

import { useTranslation } from "react-i18next";
import { APP_STATUS_ORDER, APP_STATUS_LABELS } from "@/constants";
import type { Company, Contact, AppStatus, WorkMode, EmploymentType, Priority } from "@/types";

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
  job_requirements?: string;
  job_description?: string;
}

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
          <label className={labelCls}>
            <span>{t("applications.form.position")}</span>
            <span className="text-destructive ml-0.5">*</span>
          </label>
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
          <select
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            className={inputCls}
          >
            <option value="">{t("applications.form.companyPlaceholder")}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Status & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.status")}</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AppStatus })}
            className={inputCls}
          >
            {APP_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {APP_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>{t("applications.form.priority")}</label>
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

      {/* Row 3: Work Mode, Job Type, Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className={labelCls}>{t("applications.form.mode")}</label>
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
          <label className={labelCls}>{t("applications.form.jobType")}</label>
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

      {/* Row 5: Platform & Deadline */}
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
          <input
            type="date"
            value={form.deadline ? form.deadline.split("T")[0] : ""}
            onChange={(e) =>
              setForm({
                ...form,
                deadline: e.target.value ? new Date(e.target.value).toISOString() : "",
              })
            }
            className={inputCls}
          />
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
          <select
            value={form.recruiter_id}
            onChange={(e) => setForm({ ...form, recruiter_id: e.target.value })}
            className={inputCls}
          >
            <option value="">{t("applications.form.recruiterPlaceholder")}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role || "Contact"})
              </option>
            ))}
          </select>
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
