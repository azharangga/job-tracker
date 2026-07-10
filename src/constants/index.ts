import type {
  AppStatus,
  DocumentKind,
  EmploymentType,
  EventKind,
  Priority,
  TaskStatus,
  WorkMode,
} from "@/types";

export const APP_NAME = "Job Tracker";

// -------------------- Status --------------------
export const APP_STATUS_ORDER: AppStatus[] = [
  "wishlist",
  "applied",
  "hr_screening",
  "technical_test",
  "user_interview",
  "hr_interview",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];

export const APP_STATUS_LABELS: Record<AppStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  hr_screening: "HR Screening",
  technical_test: "Technical Test",
  user_interview: "User Interview",
  hr_interview: "HR Interview",
  final_interview: "Final Interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// dot / bg / text token names for sticker palette
export const APP_STATUS_STICKER: Record<
  AppStatus,
  "sky" | "purple" | "pink" | "orange" | "teal" | "green" | "brown" | "muted"
> = {
  wishlist: "teal",
  applied: "sky",
  hr_screening: "teal",
  technical_test: "orange",
  user_interview: "orange",
  hr_interview: "orange",
  final_interview: "pink",
  offer: "green",
  accepted: "green",
  rejected: "brown",
  withdrawn: "muted",
};

export const APP_ACTIVE_STATUSES: AppStatus[] = [
  "applied",
  "hr_screening",
  "technical_test",
  "user_interview",
  "hr_interview",
  "final_interview",
  "offer",
];

// Kanban columns (subset of statuses, in board order)
export const KANBAN_COLUMNS: AppStatus[] = [
  "wishlist",
  "applied",
  "hr_screening",
  "technical_test",
  "user_interview",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
];

// -------------------- Work mode --------------------
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

// -------------------- Employment type --------------------
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  freelance: "Freelance",
  contract: "Contract",
};

// -------------------- Priority --------------------
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_STICKER: Record<
  Priority,
  "sky" | "purple" | "pink" | "orange" | "teal" | "green" | "brown" | "muted"
> = {
  low: "muted",
  medium: "sky",
  high: "orange",
  urgent: "pink",
};

// -------------------- Task --------------------
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

// -------------------- Document --------------------
export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  cv: "CV / Resume",
  cover_letter: "Cover Letter",
  portfolio: "Portfolio",
  certificate: "Certificate",
  transcript: "Transcript",
  photo: "Photo",
  other: "Other",
};

// -------------------- Event --------------------
export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  interview: "Interview",
  technical_test: "Technical Test",
  deadline: "Deadline",
  follow_up: "Follow-up",
  offer_call: "Offer Call",
  other: "Other",
};

export const EVENT_KIND_STICKER: Record<
  EventKind,
  "sky" | "purple" | "pink" | "orange" | "teal" | "green" | "brown" | "muted"
> = {
  interview: "sky",
  technical_test: "orange",
  deadline: "pink",
  follow_up: "sky",
  offer_call: "green",
  other: "muted",
};

export const PLATFORMS = [
  "LinkedIn",
  "Glints",
  "Jobstreet",
  "Kalibrr",
  "Referral",
  "Website",
  "Indeed",
  "Wellfound",
  "Other",
];
