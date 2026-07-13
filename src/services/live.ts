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
// Helper functions to map custom DocumentKind categories that are not supported in Postgres enum to "other" and vice versa
function mapDbDocument(doc: any): DocumentRow {
  if (!doc) return doc;
  let kind = doc.kind;
  if (kind === "other") {
    const ext = doc.name.split(".").pop()?.toLowerCase() || "";
    const mime = doc.mime || "";
    if (ext === "pdf" || mime === "application/pdf") {
      kind = "pdf";
    } else if (["xlsx", "xls", "csv"].includes(ext) || ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(mime)) {
      kind = "spreadsheet";
    } else if (["docx", "doc", "odt"].includes(ext) || ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.oasis.opendocument.text"].includes(mime)) {
      kind = "word";
    } else if (["pptx", "ppt", "odp"].includes(ext) || ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.oasis.opendocument.presentation"].includes(mime)) {
      kind = "powerpoint";
    }
  }
  return {
    ...doc,
    kind,
  };
}

function sanitizeDbDocument(patch: Partial<DocumentRow>): any {
  if (!patch) return patch;
  let kind = patch.kind;
  if (kind === "pdf" || kind === "spreadsheet" || kind === "word" || kind === "powerpoint") {
    kind = "other";
  }
  return {
    ...patch,
    kind,
  };
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data as unknown as DocumentRow[]) ?? [];
  return rows.map(mapDbDocument);
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
export async function uploadDocumentFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const path = `${Date.now()}_${file.name}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
  
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || supabaseKey;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/documents/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabaseKey);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(path);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during file upload"));
    xhr.send(file);
  });
}

export async function createDocument(patch: Partial<DocumentRow>) {
  const sanitized = sanitizeDbDocument(patch);
  const { data, error } = await supabase
    .from("documents")
    .insert({ name: "Untitled", kind: "other", size: 0, version: 1, ...sanitized } as never)
    .select("*")
    .single();
  if (error) throw error;
  return mapDbDocument(data) as unknown as DocumentRow;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return mapDbDocument(data) as unknown as DocumentRow | null;
}

export async function updateDocument(id: string, patch: Partial<DocumentRow>) {
  const sanitized = sanitizeDbDocument(patch);
  const { data, error } = await supabase
    .from("documents")
    .update(sanitized as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDbDocument(data) as unknown as DocumentRow;
}


