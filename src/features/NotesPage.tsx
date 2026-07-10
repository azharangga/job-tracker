import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import ReactMarkdown from "react-markdown";
import { Plus, MoreVertical, Trash2, StickyNote } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listNotes, createNote, deleteNote } from "@/services";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NoteRow } from "@/types";

export function NotesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["notes"], queryFn: listNotes });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body_markdown: "" });

  useEffect(() => {
    if (!selectedId && data.length > 0) setSelectedId(data[0].id);
  }, [data, selectedId]);
  const selected = data.find((n) => n.id === selectedId) ?? data[0];

  const createMut = useMutation({
    mutationFn: () =>
      createNote({ title: form.title, body_markdown: form.body_markdown } as Partial<NoteRow>),
    onSuccess: (n: NoteRow) => {
      toast.success(t("notes.created"));
      setForm({ title: "", body_markdown: "" });
      setOpenCreate(false);
      setSelectedId(n.id);
      void qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      toast.success(t("notes.deleted"));
      setConfirmId(null);
      setSelectedId(null);
      void qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader
        title={t("notes.title")}
        description={t("notes.description")}
        count={data.length}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("notes.new")}</span>
          </button>
        }
      />

      {data.length === 0 ? (
        <EmptyState icon={<StickyNote />} title={t("empty.title")} description={t("empty.description")} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[520px]">
          <div className="rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
            <ul className="divide-y divide-hairline max-h-[70vh] overflow-y-auto">
              {data.map((n) => (
                <li key={n.id} className="relative">
                  <button
                    onClick={() => setSelectedId(n.id)}
                    className={cn(
                      "w-full text-left p-3.5 hover:bg-surface-muted transition-colors",
                      selected?.id === n.id && "bg-primary-soft/40",
                    )}
                  >
                    <div className="text-sm font-medium text-ink truncate pr-8">{n.title}</div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate pr-8">
                      {n.body_markdown.replace(/[#*`>-]/g, "").slice(0, 80)}
                    </div>
                    <div className="text-[10px] text-ink-faint mt-1.5">{formatRelative(n.updated_at)}</div>
                  </button>
                  <div className="absolute right-2 top-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-6 w-6 grid place-items-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors">
                        <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setConfirmId(n.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-surface border border-hairline p-5 sm:p-8 shadow-soft overflow-y-auto max-h-[70vh]">
            {selected && (
              <>
                <h1 className="text-h3 sm:text-h2 text-ink break-words">{selected.title}</h1>
                <div className="text-xs text-ink-faint mt-1">{formatRelative(selected.updated_at)}</div>
                <div className="prose prose-sm mt-6 max-w-none text-ink-secondary prose-headings:text-ink prose-strong:text-ink prose-a:text-primary break-words">
                  <ReactMarkdown>{selected.body_markdown}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <FormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("notes.new")}
        submitLabel={t("common.create")}
        onSubmit={async () => {
          if (!form.title.trim()) { toast.error(t("common.required")); return; }
          await createMut.mutateAsync();
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary mb-1.5 block">{t("notes.form.title")}</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("notes.form.titlePlaceholder")}
            className="w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-secondary mb-1.5 block">{t("notes.form.content")}</span>
          <textarea
            rows={8}
            value={form.body_markdown}
            onChange={(e) => setForm({ ...form, body_markdown: e.target.value })}
            placeholder={t("notes.form.contentPlaceholder")}
            className="w-full px-3 py-2 rounded-md bg-surface border border-hairline text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors font-mono"
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
