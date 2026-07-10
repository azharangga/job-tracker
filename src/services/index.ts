import { supabase } from "@/integrations/supabase/client";
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

// ----------------------- Applications -----------------------
export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, company:companies(*), recruiter:contacts(*)")
    .order("applied_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Application[]) ?? [];
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, company:companies(*), recruiter:contacts(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Application) ?? null;
}

export async function updateApplication(id: string, patch: Partial<Application>) {
  const { data, error } = await supabase
    .from("applications")
    .update(patch as never)
    .eq("id", id)
    .select("*, company:companies(*), recruiter:contacts(*)")
    .single();
  if (error) throw error;
  return data as unknown as Application;
}

export async function createApplication(patch: Partial<Application>) {
  const { data, error } = await supabase
    .from("applications")
    .insert({ position: "Untitled role", ...(patch as Record<string, unknown>) } as never)
    .select("*, company:companies(*)")
    .single();
  if (error) throw error;
  return data as unknown as Application;
}

export async function deleteApplication(id: string) {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

export async function moveStatus(id: string, next: AppStatus) {
  await updateApplication(id, { status: next });
  await supabase.from("application_timeline").insert({
    application_id: id,
    stage: next,
    notes: `Moved to ${next}`,
  } as never);
  await supabase.from("application_activities").insert({
    application_id: id,
    type: "status_changed",
    payload: { to: next },
  } as never);
}

// ----------------------- Timeline / checklist / activities -----------------------
export async function listTimeline(applicationId: string): Promise<TimelineEntry[]> {
  const { data, error } = await supabase
    .from("application_timeline")
    .select("*")
    .eq("application_id", applicationId)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as TimelineEntry[]) ?? [];
}

export async function listChecklist(applicationId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from("application_checklist")
    .select("*")
    .eq("application_id", applicationId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as unknown as ChecklistItem[]) ?? [];
}

export async function toggleChecklist(id: string, done: boolean) {
  const { error } = await supabase
    .from("application_checklist")
    .update({ done } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function listActivities(applicationId: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("application_activities")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as ActivityEntry[]) ?? [];
}

// ----------------------- Companies -----------------------
export async function listCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as Company[]) ?? [];
}

export async function getCompany(id: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Company) ?? null;
}

// ----------------------- Contacts -----------------------
export async function listContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*, company:companies(id,name,slug)")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as Contact[]) ?? [];
}

// ----------------------- Documents -----------------------
export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as DocumentRow[]) ?? [];
}

// ----------------------- Tasks -----------------------
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, application:applications(id,position,company_id,company:companies(id,name,slug))")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as unknown as Task[]) ?? [];
}

export async function toggleTaskStatus(id: string, done: boolean) {
  const { error } = await supabase
    .from("tasks")
    .update({ status: done ? "done" : "todo" } as never)
    .eq("id", id);
  if (error) throw error;
}

// ----------------------- Notes -----------------------
export async function listNotes(): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as NoteRow[]) ?? [];
}

// ----------------------- Calendar -----------------------
export async function listEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, application:applications(id,position,company_id,company:companies(id,name,slug))")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as CalendarEvent[]) ?? [];
}

// ----------------------- CRUD Extensions -----------------------

// Companies
export async function createCompany(patch: Partial<Company>) {
  const { data, error } = await supabase
    .from("companies")
    .insert({ name: "Untitled", ...(patch as Record<string, unknown>) } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Company;
}

export async function updateCompany(id: string, patch: Partial<Company>) {
  const { data, error } = await supabase
    .from("companies")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Company;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// Contacts
export async function createContact(patch: Partial<Contact>) {
  const { data, error } = await supabase
    .from("contacts")
    .insert({ name: "Untitled", ...(patch as Record<string, unknown>) } as never)
    .select("*, company:companies(id,name,slug)")
    .single();
  if (error) throw error;
  return data as unknown as Contact;
}

export async function updateContact(id: string, patch: Partial<Contact>) {
  const { data, error } = await supabase
    .from("contacts")
    .update(patch as never)
    .eq("id", id)
    .select("*, company:companies(id,name,slug)")
    .single();
  if (error) throw error;
  return data as unknown as Contact;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

// Tasks
export async function createTask(patch: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ title: "Untitled task", status: "todo", ...(patch as Record<string, unknown>) } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Task;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// Notes
export async function createNote(patch: Partial<NoteRow>) {
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: "Untitled", body_markdown: "", tags: [], ...(patch as Record<string, unknown>) } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as NoteRow;
}

export async function updateNote(id: string, patch: Partial<NoteRow>) {
  const { data, error } = await supabase
    .from("notes")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as NoteRow;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// Documents
export async function uploadDocumentFile(file: File): Promise<string> {
  const path = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from("documents").upload(path, file);
  if (error) throw error;
  return data.path;
}

export async function createDocument(patch: Partial<DocumentRow>) {
  const { data, error } = await supabase
    .from("documents")
    .insert({ name: "Untitled", kind: "other", size: 0, version: 1, ...(patch as Record<string, unknown>) } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as DocumentRow;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}
