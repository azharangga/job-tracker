import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { PriorityBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listTasks, toggleTaskStatus, createTask, deleteTask } from "@/services";
import { formatDate } from "@/lib/format";
import { isToday, isTomorrow, isPast, parseISO, isThisWeek } from "date-fns";
import type { Task } from "@/types";

export function TasksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tasks"], queryFn: listTasks });

  const [openCreate, setOpenCreate] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", due_at: "" });

  const createMut = useMutation({
    mutationFn: () =>
      createTask({
        title: form.title,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      } as Partial<Task>),
    onSuccess: () => {
      toast.success(t("tasks.created"));
      setForm({ title: "", due_at: "" });
      setOpenCreate(false);
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success(t("tasks.deleted"));
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buckets: Record<string, Task[]> = {
    Overdue: [], Today: [], Tomorrow: [], "This Week": [], Later: [], "No date": [], Done: [],
  };
  for (const task of data) {
    if (task.status === "done") { buckets.Done.push(task); continue; }
    if (!task.due_at) { buckets["No date"].push(task); continue; }
    const d = parseISO(task.due_at);
    if (isPast(d) && !isToday(d)) buckets.Overdue.push(task);
    else if (isToday(d)) buckets.Today.push(task);
    else if (isTomorrow(d)) buckets.Tomorrow.push(task);
    else if (isThisWeek(d)) buckets["This Week"].push(task);
    else buckets.Later.push(task);
  }

  const toggle = async (task: Task) => {
    const done = task.status !== "done";
    qc.setQueryData<Task[]>(["tasks"], (prev) =>
      (prev ?? []).map((x) => (x.id === task.id ? { ...x, status: done ? "done" : "todo" } : x)),
    );
    try {
      await toggleTaskStatus(task.id, done);
    } catch (e) {
      toast.error((e as Error).message);
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    }
  };

  const openCount = data.filter((task) => task.status !== "done").length;

  return (
    <AppShell>
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        count={openCount}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("tasks.new")}</span>
          </button>
        }
      />

      {data.length === 0 ? (
        <EmptyState title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="space-y-6">
          {Object.entries(buckets).map(([label, items]) =>
            items.length === 0 ? null : (
              <section key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-sm font-semibold text-ink-secondary">{label}</h2>
                  <span className="text-xs text-ink-faint tabular-nums">{items.length}</span>
                </div>
                <div className="rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
                  {items.map((task, i) => (
                    <div key={task.id} className={`flex items-start gap-3 px-3 sm:px-4 py-3 ${i > 0 ? "border-t border-hairline" : ""}`}>
                      <button
                        onClick={() => void toggle(task)}
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 grid place-items-center transition-colors ${task.status === "done" ? "bg-sticker-green border-sticker-green" : "border-ink-faint hover:border-ink"}`}
                      >
                        {task.status === "done" && (
                          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5 text-white" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${task.status === "done" ? "text-ink-muted line-through" : "text-ink"} truncate`}>{task.title}</div>
                        <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-2">
                          {task.application?.company?.name && <span className="truncate max-w-[160px]">{task.application.company.name}</span>}
                          {task.due_at && <span>· {formatDate(task.due_at, "EEE MMM d")}</span>}
                        </div>
                      </div>
                      {task.priority && <PriorityBadge priority={task.priority} />}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 w-7 grid place-items-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors shrink-0">
                          <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirmId(task.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("tasks.new")}
        submitLabel={t("common.create")}
        onSubmit={async () => {
          if (!form.title.trim()) { toast.error(t("common.required")); return; }
          await createMut.mutateAsync();
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary mb-1.5 block">{t("tasks.form.title")}</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("tasks.form.titlePlaceholder")}
            className="w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary mb-1.5 block">{t("tasks.form.dueAt")}</span>
          <input
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm({ ...form, due_at: e.target.value })}
            className="w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          />
        </label>
      </FormDialog>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(v) => !v && setConfirmId(null)}
        loading={deleteMut.isPending}
        onConfirm={() => { if (confirmId) deleteMut.mutate(confirmId); }}
      />
    </AppShell>
  );
}
