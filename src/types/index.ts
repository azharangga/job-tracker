export type UUID = string;

export type AppStatus =
  | "wishlist"
  | "applied"
  | "hr_screening"
  | "technical_test"
  | "user_interview"
  | "hr_interview"
  | "final_interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type WorkMode = "remote" | "hybrid" | "onsite";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "internship"
  | "freelance"
  | "contract";
export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type DocumentKind =
  | "cv"
  | "cover_letter"
  | "portfolio"
  | "certificate"
  | "transcript"
  | "photo"
  | "pdf"
  | "spreadsheet"
  | "word"
  | "powerpoint"
  | "other";
export type EventKind =
  | "interview"
  | "technical_test"
  | "deadline"
  | "follow_up"
  | "offer_call"
  | "other";

export interface User {
  id: UUID;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface Company {
  id: UUID;
  name: string;
  slug: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: UUID;
  company_id: UUID | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: Pick<Company, "id" | "name" | "slug"> | null;
}

export interface Application {
  id: UUID;
  company_id: UUID | null;
  position: string;
  status: AppStatus;
  work_mode: WorkMode | null;
  employment_type: EmploymentType | null;
  platform: string | null;
  job_url: string | null;
  career_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  applied_at: string | null;
  deadline: string | null;
  priority: Priority | null;
  recruiter_id: UUID | null;
  cv_document_id: UUID | null;
  cover_letter_document_id: UUID | null;
  portfolio_document_id: UUID | null;
  location: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  company?: Company | null;
  recruiter?: Contact | null;
}

export interface TimelineEntry {
  id: UUID;
  application_id: UUID;
  stage: AppStatus;
  occurred_at: string;
  notes: string | null;
  created_at: string;
}

export interface ActivityEntry {
  id: UUID;
  application_id: UUID;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ChecklistItem {
  id: UUID;
  application_id: UUID;
  label: string;
  done: boolean;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: UUID;
  application_id: UUID | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  application?: Pick<Application, "id" | "position" | "company_id"> & {
    company?: Pick<Company, "id" | "name" | "slug"> | null;
  };
}

export interface DocumentRow {
  id: UUID;
  name: string;
  kind: DocumentKind;
  storage_path: string | null;
  size: number | null;
  mime: string | null;
  version: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id: UUID;
  application_id: UUID | null;
  company_id: UUID | null;
  title: string;
  body_markdown: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: UUID;
  application_id: UUID | null;
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  application?: Pick<Application, "id" | "position" | "company_id"> & {
    company?: Pick<Company, "id" | "name" | "slug"> | null;
  };
}
