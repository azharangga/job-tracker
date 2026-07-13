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

// Helper function to safely read from localStorage
function getLocalData(key: string): any[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(`demo_${key}`);
  return stored ? JSON.parse(stored) : [];
}

// Helper to write to localStorage
function setLocalData(key: string, data: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`demo_${key}`, JSON.stringify(data));
}

// Generate v4 UUID-like string
function generateUUID() {
  return 'demo-uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
}

export async function listApplications(): Promise<Application[]> {
  const apps = getLocalData("applications") as Application[];
  const companies = getLocalData("companies") as Company[];
  const contacts = getLocalData("contacts") as Contact[];

  return apps.map(app => ({
    ...app,
    company: companies.find(c => c.id === app.company_id) || null,
    recruiter: contacts.find(c => c.id === app.recruiter_id) || null,
  })).sort((a, b) => {
    const dateA = a.applied_at ? new Date(a.applied_at).getTime() : 0;
    const dateB = b.applied_at ? new Date(b.applied_at).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getApplication(id: string): Promise<Application | null> {
  const apps = getLocalData("applications") as Application[];
  const companies = getLocalData("companies") as Company[];
  const contacts = getLocalData("contacts") as Contact[];

  const app = apps.find(a => a.id === id);
  if (!app) return null;

  return {
    ...app,
    company: companies.find(c => c.id === app.company_id) || null,
    recruiter: contacts.find(c => c.id === app.recruiter_id) || null,
  };
}

export async function updateApplication(id: string, patch: Partial<Application>) {
  const apps = getLocalData("applications") as Application[];
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error("Application not found");

  const updated = { ...apps[index], ...patch };
  apps[index] = updated;
  setLocalData("applications", apps);

  const companies = getLocalData("companies") as Company[];
  const contacts = getLocalData("contacts") as Contact[];
  return {
    ...updated,
    company: companies.find(c => c.id === updated.company_id) || null,
    recruiter: contacts.find(c => c.id === updated.recruiter_id) || null,
  };
}

export async function createApplication(patch: Partial<Application>) {
  const apps = getLocalData("applications") as Application[];
  const newApp: any = {
    id: generateUUID(),
    position: "Untitled role",
    status: "applied",
    created_at: new Date().toISOString(),
    ...patch,
  };

  apps.push(newApp);
  setLocalData("applications", apps);

  const companies = getLocalData("companies") as Company[];
  return {
    ...newApp,
    company: companies.find(c => c.id === newApp.company_id) || null,
    recruiter: null,
  };
}

export async function deleteApplication(id: string) {
  const apps = getLocalData("applications") as Application[];
  const filtered = apps.filter(a => a.id !== id);
  setLocalData("applications", filtered);
}

export async function moveStatus(id: string, next: AppStatus) {
  await updateApplication(id, { status: next });

  // Add timeline entry
  const timeline = getLocalData("application_timeline");
  timeline.push({
    id: generateUUID(),
    application_id: id,
    stage: next,
    notes: `Moved to ${next}`,
    occurred_at: new Date().toISOString(),
  });
  setLocalData("application_timeline", timeline);

  // Add activity entry
  const activities = getLocalData("application_activities");
  activities.push({
    id: generateUUID(),
    application_id: id,
    type: "status_changed",
    payload: { to: next },
    created_at: new Date().toISOString(),
  });
  setLocalData("application_activities", activities);
}

// ----------------------- Timeline / checklist / activities -----------------------
export async function listTimeline(applicationId: string): Promise<TimelineEntry[]> {
  const timeline = getLocalData("application_timeline") as TimelineEntry[];
  return timeline
    .filter(t => t.application_id === applicationId)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
}

export async function listChecklist(applicationId: string): Promise<ChecklistItem[]> {
  const checklist = getLocalData("application_checklist") as ChecklistItem[];
  return checklist
    .filter(c => c.application_id === applicationId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function toggleChecklist(id: string, done: boolean) {
  const checklist = getLocalData("application_checklist") as ChecklistItem[];
  const index = checklist.findIndex(c => c.id === id);
  if (index !== -1) {
    checklist[index].done = done;
    setLocalData("application_checklist", checklist);
  }
}

export async function listActivities(applicationId: string): Promise<ActivityEntry[]> {
  const activities = getLocalData("application_activities") as ActivityEntry[];
  return activities
    .filter(a => a.application_id === applicationId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ----------------------- Companies -----------------------
export async function listCompanies(): Promise<Company[]> {
  const companies = getLocalData("companies") as Company[];
  return companies.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCompany(id: string): Promise<Company | null> {
  const companies = getLocalData("companies") as Company[];
  return companies.find(c => c.id === id) || null;
}

// ----------------------- Contacts -----------------------
export async function listContacts(): Promise<Contact[]> {
  const contacts = getLocalData("contacts") as Contact[];
  const companies = getLocalData("companies") as Company[];

  return contacts.map(contact => ({
    ...contact,
    company: companies.find(c => c.id === contact.company_id) || null,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------- Documents -----------------------
export async function listDocuments(): Promise<DocumentRow[]> {
  const docs = getLocalData("documents") as DocumentRow[];
  return docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ----------------------- Tasks -----------------------
export async function listTasks(): Promise<Task[]> {
  const tasks = getLocalData("tasks") as Task[];
  const apps = getLocalData("applications") as Application[];
  const companies = getLocalData("companies") as Company[];

  return tasks.map(task => {
    const app = apps.find(a => a.id === task.application_id);
    const company = app ? companies.find(c => c.id === app.company_id) : null;
    return {
      ...task,
      application: app ? {
        id: app.id,
        position: app.position,
        company_id: app.company_id,
        company: company || undefined,
      } : undefined,
    };
  }).sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
}

export async function toggleTaskStatus(id: string, done: boolean) {
  const tasks = getLocalData("tasks") as Task[];
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index].status = done ? "done" : "todo";
    setLocalData("tasks", tasks);
  }
}

// ----------------------- Notes -----------------------
export async function listNotes(): Promise<NoteRow[]> {
  const notes = getLocalData("notes") as NoteRow[];
  return notes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

// ----------------------- Calendar -----------------------
export async function listEvents(): Promise<CalendarEvent[]> {
  const events = getLocalData("calendar_events") as CalendarEvent[];
  const apps = getLocalData("applications") as Application[];
  const companies = getLocalData("companies") as Company[];

  return events.map(evt => {
    const app = apps.find(a => a.id === evt.application_id);
    const company = app ? companies.find(c => c.id === app.company_id) : null;
    return {
      ...evt,
      application: app ? {
        id: app.id,
        position: app.position,
        company_id: app.company_id,
        company: company || undefined,
      } : undefined,
    };
  }).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

// ----------------------- CRUD Extensions -----------------------

// Companies
export async function createCompany(patch: Partial<Company>) {
  const companies = getLocalData("companies") as Company[];
  const newCompany: Company = {
    id: generateUUID(),
    name: "Untitled",
    slug: (patch.name || "untitled").toLowerCase().replace(/\s+/g, "-"),
    created_at: new Date().toISOString(),
    ...patch,
  } as any;

  companies.push(newCompany);
  setLocalData("companies", companies);
  return newCompany;
}

export async function updateCompany(id: string, patch: Partial<Company>) {
  const companies = getLocalData("companies") as Company[];
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) throw new Error("Company not found");

  const updated = { ...companies[index], ...patch };
  companies[index] = updated;
  setLocalData("companies", companies);
  return updated;
}

export async function deleteCompany(id: string) {
  const companies = getLocalData("companies") as Company[];
  const filtered = companies.filter(c => c.id !== id);
  setLocalData("companies", filtered);
}

// Contacts
export async function createContact(patch: Partial<Contact>) {
  const contacts = getLocalData("contacts") as Contact[];
  const newContact: Contact = {
    id: generateUUID(),
    name: "Untitled",
    created_at: new Date().toISOString(),
    ...patch,
  } as any;

  contacts.push(newContact);
  setLocalData("contacts", contacts);

  const companies = getLocalData("companies") as Company[];
  return {
    ...newContact,
    company: companies.find(c => c.id === newContact.company_id) || null,
  };
}

export async function updateContact(id: string, patch: Partial<Contact>) {
  const contacts = getLocalData("contacts") as Contact[];
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) throw new Error("Contact not found");

  const updated = { ...contacts[index], ...patch };
  contacts[index] = updated;
  setLocalData("contacts", contacts);

  const companies = getLocalData("companies") as Company[];
  return {
    ...updated,
    company: companies.find(c => c.id === updated.company_id) || null,
  };
}

export async function deleteContact(id: string) {
  const contacts = getLocalData("contacts") as Contact[];
  const filtered = contacts.filter(c => c.id !== id);
  setLocalData("contacts", filtered);
}

// Tasks
export async function createTask(patch: Partial<Task>) {
  const tasks = getLocalData("tasks") as Task[];
  const newTask: Task = {
    id: generateUUID(),
    title: "Untitled task",
    status: "todo",
    created_at: new Date().toISOString(),
    ...patch,
  } as any;

  tasks.push(newTask);
  setLocalData("tasks", tasks);
  return newTask;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const tasks = getLocalData("tasks") as Task[];
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) throw new Error("Task not found");

  const updated = { ...tasks[index], ...patch };
  tasks[index] = updated;
  setLocalData("tasks", tasks);
  return updated;
}

export async function deleteTask(id: string) {
  const tasks = getLocalData("tasks") as Task[];
  const filtered = tasks.filter(t => t.id !== id);
  setLocalData("tasks", filtered);
}

// Notes
export async function createNote(patch: Partial<NoteRow>) {
  const notes = getLocalData("notes") as NoteRow[];
  const newNote: NoteRow = {
    id: generateUUID(),
    title: "Untitled",
    body_markdown: "",
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  } as any;

  notes.push(newNote);
  setLocalData("notes", notes);
  return newNote;
}

export async function updateNote(id: string, patch: Partial<NoteRow>) {
  const notes = getLocalData("notes") as NoteRow[];
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) throw new Error("Note not found");

  const updated = {
    ...notes[index],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  notes[index] = updated;
  setLocalData("notes", notes);
  return updated;
}

export async function deleteNote(id: string) {
  const notes = getLocalData("notes") as NoteRow[];
  const filtered = notes.filter(n => n.id !== id);
  setLocalData("notes", filtered);
}

// Documents
export async function uploadDocumentFile(file: File): Promise<string> {
  // Simulating path for uploaded document locally
  return `demo-doc-${Date.now()}-${file.name}`;
}

export async function createDocument(patch: Partial<DocumentRow>) {
  const docs = getLocalData("documents") as DocumentRow[];
  const newDoc: DocumentRow = {
    id: generateUUID(),
    name: "Untitled",
    kind: "other",
    size: 0,
    version: 1,
    created_at: new Date().toISOString(),
    ...patch,
  } as any;

  docs.push(newDoc);
  setLocalData("documents", docs);
  return newDoc;
}

export async function deleteDocument(id: string) {
  const docs = getLocalData("documents") as DocumentRow[];
  const filtered = docs.filter(d => d.id !== id);
  setLocalData("documents", filtered);
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const docs = getLocalData("documents") as DocumentRow[];
  return docs.find((d) => d.id === id) || null;
}

export async function updateDocument(id: string, patch: Partial<DocumentRow>) {
  const docs = getLocalData("documents") as DocumentRow[];
  const idx = docs.findIndex((d) => d.id === id);
  if (idx !== -1) {
    docs[idx] = { ...docs[idx], ...patch, updated_at: new Date().toISOString() };
    setLocalData("documents", docs);
    return docs[idx];
  }
  throw new Error("Document not found");
}


