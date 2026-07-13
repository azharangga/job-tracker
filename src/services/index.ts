import * as liveRepo from "./live";
import * as demoRepo from "./demo";
import type {
  Application,
  AppStatus,
  Company,
  Contact,
  DocumentRow,
  NoteRow,
  Task,
  TimelineEntry,
  ChecklistItem,
  ActivityEntry,
  CalendarEvent,
} from "@/types";

// Helper to determine if we are in demo mode
function isDemo() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("demo_user_session");
}

export function listApplications(): Promise<Application[]> {
  return isDemo() ? demoRepo.listApplications() : liveRepo.listApplications();
}

export function getApplication(id: string): Promise<Application | null> {
  return isDemo() ? demoRepo.getApplication(id) : liveRepo.getApplication(id);
}

export function updateApplication(id: string, patch: Partial<Application>): Promise<Application> {
  return isDemo() ? demoRepo.updateApplication(id, patch) : liveRepo.updateApplication(id, patch);
}

export function createApplication(patch: Partial<Application>): Promise<Application> {
  return isDemo() ? demoRepo.createApplication(patch) : liveRepo.createApplication(patch);
}

export function deleteApplication(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteApplication(id) : liveRepo.deleteApplication(id);
}

export function moveStatus(id: string, next: AppStatus): Promise<void> {
  return isDemo() ? demoRepo.moveStatus(id, next) : liveRepo.moveStatus(id, next);
}

export function listTimeline(applicationId: string): Promise<TimelineEntry[]> {
  return isDemo() ? demoRepo.listTimeline(applicationId) : liveRepo.listTimeline(applicationId);
}

export function listChecklist(applicationId: string): Promise<ChecklistItem[]> {
  return isDemo() ? demoRepo.listChecklist(applicationId) : liveRepo.listChecklist(applicationId);
}

export function toggleChecklist(id: string, done: boolean): Promise<void> {
  return isDemo() ? demoRepo.toggleChecklist(id, done) : liveRepo.toggleChecklist(id, done);
}

export function listActivities(applicationId: string): Promise<ActivityEntry[]> {
  return isDemo() ? demoRepo.listActivities(applicationId) : liveRepo.listActivities(applicationId);
}

export function listCompanies(): Promise<Company[]> {
  return isDemo() ? demoRepo.listCompanies() : liveRepo.listCompanies();
}

export function getCompany(id: string): Promise<Company | null> {
  return isDemo() ? demoRepo.getCompany(id) : liveRepo.getCompany(id);
}

export function listContacts(): Promise<Contact[]> {
  return isDemo() ? demoRepo.listContacts() : liveRepo.listContacts();
}

export function listDocuments(): Promise<DocumentRow[]> {
  return isDemo() ? demoRepo.listDocuments() : liveRepo.listDocuments();
}

export function listTasks(): Promise<Task[]> {
  return isDemo() ? demoRepo.listTasks() : liveRepo.listTasks();
}

export function toggleTaskStatus(id: string, done: boolean): Promise<void> {
  return isDemo() ? demoRepo.toggleTaskStatus(id, done) : liveRepo.toggleTaskStatus(id, done);
}

export function listNotes(): Promise<NoteRow[]> {
  return isDemo() ? demoRepo.listNotes() : liveRepo.listNotes();
}

export function listEvents(): Promise<CalendarEvent[]> {
  return isDemo() ? demoRepo.listEvents() : liveRepo.listEvents();
}

export function createCompany(patch: Partial<Company>): Promise<Company> {
  return isDemo() ? demoRepo.createCompany(patch) : liveRepo.createCompany(patch);
}

export function updateCompany(id: string, patch: Partial<Company>): Promise<Company> {
  return isDemo() ? demoRepo.updateCompany(id, patch) : liveRepo.updateCompany(id, patch);
}

export function deleteCompany(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteCompany(id) : liveRepo.deleteCompany(id);
}

export function createContact(patch: Partial<Contact>): Promise<Contact> {
  return isDemo() ? demoRepo.createContact(patch) : liveRepo.createContact(patch);
}

export function updateContact(id: string, patch: Partial<Contact>): Promise<Contact> {
  return isDemo() ? demoRepo.updateContact(id, patch) : liveRepo.updateContact(id, patch);
}

export function deleteContact(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteContact(id) : liveRepo.deleteContact(id);
}

export function createTask(patch: Partial<Task>): Promise<Task> {
  return isDemo() ? demoRepo.createTask(patch) : liveRepo.createTask(patch);
}

export function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  return isDemo() ? demoRepo.updateTask(id, patch) : liveRepo.updateTask(id, patch);
}

export function deleteTask(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteTask(id) : liveRepo.deleteTask(id);
}

export function createNote(patch: Partial<NoteRow>): Promise<NoteRow> {
  return isDemo() ? demoRepo.createNote(patch) : liveRepo.createNote(patch);
}

export function updateNote(id: string, patch: Partial<NoteRow>): Promise<NoteRow> {
  return isDemo() ? demoRepo.updateNote(id, patch) : liveRepo.updateNote(id, patch);
}

export function deleteNote(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteNote(id) : liveRepo.deleteNote(id);
}

export function uploadDocumentFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
  return isDemo() ? demoRepo.uploadDocumentFile(file, onProgress) : liveRepo.uploadDocumentFile(file, onProgress);
}

export function createDocument(patch: Partial<DocumentRow>): Promise<DocumentRow> {
  return isDemo() ? demoRepo.createDocument(patch) : liveRepo.createDocument(patch);
}

export function deleteDocument(id: string): Promise<void> {
  return isDemo() ? demoRepo.deleteDocument(id) : liveRepo.deleteDocument(id);
}

export function getDocument(id: string): Promise<DocumentRow | null> {
  return isDemo() ? demoRepo.getDocument(id) : liveRepo.getDocument(id);
}

export function updateDocument(id: string, patch: Partial<DocumentRow>): Promise<DocumentRow> {
  return isDemo() ? demoRepo.updateDocument(id, patch) : liveRepo.updateDocument(id, patch);
}


