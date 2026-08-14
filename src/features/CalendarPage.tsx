"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, Link2, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EventKindBadge } from "@/components/common/badges";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { listEvents, createEvent, updateEvent, deleteEvent } from "@/services";
import { EVENT_KIND_LABELS, EVENT_KIND_STICKER } from "@/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CalendarEvent, EventKind } from "@/types";

const EVENT_KINDS: EventKind[] = ["interview", "technical_test", "deadline", "follow_up", "offer_call", "other"];

type EventForm = {
  title: string;
  kind: EventKind;
  starts_at: string;
  ends_at: string;
  location: string;
  url: string;
  notes: string;
};

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return "";
  // Convert ISO string to local datetime-local input format
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(val: string): string {
  if (!val) return "";
  return new Date(val).toISOString();
}

const emptyForm = (date?: Date): EventForm => ({
  title: "",
  kind: "interview",
  starts_at: date ? `${format(date, "yyyy-MM-dd")}T09:00` : "",
  ends_at: "",
  location: "",
  url: "",
  notes: "",
});

export function CalendarPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["events"], queryFn: listEvents });
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedEvents = data.filter((e) => isSameDay(parseISO(e.starts_at), selected));

  const createMut = useMutation({
    mutationFn: (f: EventForm) => createEvent({
      title: f.title,
      kind: f.kind,
      starts_at: fromLocalDatetimeValue(f.starts_at),
      ends_at: f.ends_at ? fromLocalDatetimeValue(f.ends_at) : null,
      location: f.location || null,
      url: f.url || null,
      notes: f.notes || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: EventForm }) => updateEvent(id, {
      title: f.title,
      kind: f.kind,
      starts_at: fromLocalDatetimeValue(f.starts_at),
      ends_at: f.ends_at ? fromLocalDatetimeValue(f.ends_at) : null,
      location: f.location || null,
      url: f.url || null,
      notes: f.notes || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setDeleteTarget(null); },
  });

  function openCreate(date: Date) {
    setEditingEvent(null);
    setForm(emptyForm(date));
    setDialogOpen(true);
  }

  function openEdit(e: CalendarEvent) {
    setEditingEvent(e);
    setForm({
      title: e.title,
      kind: e.kind,
      starts_at: toLocalDatetimeValue(e.starts_at),
      ends_at: toLocalDatetimeValue(e.ends_at),
      location: e.location ?? "",
      url: e.url ?? "",
      notes: e.notes ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingEvent(null);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.title.trim() || !form.starts_at) return;
    if (editingEvent) {
      updateMut.mutate({ id: editingEvent.id, f: form });
    } else {
      createMut.mutate(form);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <AppShell>
      <PageHeader
        title={t("calendar.title")}
        description={t("calendar.description")}
        actions={
          <button
            onClick={() => openCreate(selected)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t("calendar.addEvent")}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Calendar Grid */}
        <div className="rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <div className="text-title text-ink">{format(cursor, "MMMM yyyy")}</div>
            <div className="flex gap-1">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1))} className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface-muted text-ink-secondary">
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button onClick={() => setCursor(new Date())} className="h-8 px-3 text-xs rounded-md hover:bg-surface-muted text-ink-secondary">{t("calendar.today")}</button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1))} className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface-muted text-ink-secondary">
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-hairline text-eyebrow text-ink-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 py-2 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[92px]">
            {days.map((day) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const isSel = isSameDay(day, selected);
              const events = data.filter((e) => isSameDay(parseISO(e.starts_at), day));
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "text-left p-1.5 border-r border-b border-hairline hover:bg-surface-muted/60 transition-colors group",
                    !inMonth && "bg-surface-muted/30 text-ink-faint",
                    isSel && "bg-primary-soft/40",
                  )}
                >
                  <div className="flex items-center justify-center mb-1">
                    <span className={cn("text-xs font-medium", isSel && "text-primary")}>{format(day, "d")}</span>
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((e) => (
                      <div key={e.id} className={`text-[10px] truncate px-1 py-0.5 rounded bg-sticker-${EVENT_KIND_STICKER[e.kind]}/15 text-sticker-${EVENT_KIND_STICKER[e.kind]}`}>
                        {e.title}
                      </div>
                    ))}
                    {events.length > 2 && <div className="text-[10px] text-ink-muted">+{events.length - 2}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agenda Panel */}
        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div>
              <div className="text-eyebrow text-ink-muted">{t("calendar.agenda")}</div>
              <div className="text-title text-ink mt-0.5">{format(selected, "EEEE, MMM d")}</div>
            </div>

          {selectedEvents.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-10 border-2 border-dashed border-hairline rounded-lg">
              <p className="text-sm text-ink-muted">{t("calendar.noEvents")}</p>
              <button
                onClick={() => openCreate(selected)}
                className="text-xs text-primary hover:underline font-medium"
              >
                {t("calendar.addOne")}
              </button>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {selectedEvents.map((e) => (
                <li key={e.id} className="rounded-md border border-hairline p-3 group hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-ink leading-snug">{e.title}</span>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(e)} className="h-6 w-6 grid place-items-center rounded hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => setDeleteTarget(e)} className="h-6 w-6 grid place-items-center rounded hover:bg-destructive/10 text-ink-muted hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <EventKindBadge kind={e.kind} />
                  </div>
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-xs text-ink-muted">
                      <Clock className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span>
                        {format(parseISO(e.starts_at), "HH:mm")}
                        {e.ends_at ? ` – ${format(parseISO(e.ends_at), "HH:mm")}` : ""}
                      </span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-1 text-xs text-ink-muted">
                        <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{e.location}</span>
                      </div>
                    )}
                    {e.url && (
                      <div className="flex items-center gap-1 text-xs">
                        <Link2 className="h-3 w-3 shrink-0 text-ink-muted" strokeWidth={1.75} />
                        <a href={e.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{e.url}</a>
                      </div>
                    )}
                    {e.notes && <p className="text-xs text-ink-muted mt-0.5">{e.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add / Edit Event Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDialog} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-surface rounded-xl border border-hairline shadow-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-4">
              {editingEvent ? t("calendar.editEvent") : t("calendar.newEvent")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.title")}</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("calendar.form.titlePlaceholder")}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {/* Kind */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.type")}</label>
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as EventKind })}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {EVENT_KINDS.map((k) => (
                    <option key={k} value={k}>{EVENT_KIND_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              {/* Starts At */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.start")}</label>
                <input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {/* Ends At */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.end")}</label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.location")}</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={t("calendar.form.locationPlaceholder")}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {/* URL */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.link")}</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder={t("calendar.form.linkPlaceholder")}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">{t("calendar.form.notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder={t("calendar.form.notesPlaceholder")}
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              {/* Actions */}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 text-xs rounded-md border border-hairline text-ink-muted hover:bg-muted transition-colors"
                >
                  {t("calendar.form.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs rounded-md bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-50"
                >
                  {isPending ? t("calendar.form.saving") : editingEvent ? t("calendar.form.save") : t("calendar.form.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        loading={deleteMut.isPending}
        onConfirm={async () => { if (deleteTarget) await deleteMut.mutateAsync(deleteTarget.id); }}
      />
    </AppShell>
  );
}
