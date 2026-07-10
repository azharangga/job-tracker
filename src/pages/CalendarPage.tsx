import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EventKindBadge } from "@/components/common/badges";
import { listEvents } from "@/services";
import { EVENT_KIND_STICKER } from "@/constants";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

export function CalendarPage() {
  const { t } = useTranslation();
  const { data = [] } = useQuery({ queryKey: ["events"], queryFn: listEvents });
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedEvents = data.filter((e) => isSameDay(parseISO(e.starts_at), selected));

  return (
    <AppShell>
      <PageHeader title={t("calendar.title")} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="rounded-lg bg-surface border border-hairline shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <div className="text-title text-ink">{format(cursor, "MMMM yyyy")}</div>
            <div className="flex gap-1">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1))} className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface-muted text-ink-secondary">
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button onClick={() => setCursor(new Date())} className="h-8 px-3 text-xs rounded-md hover:bg-surface-muted text-ink-secondary">Today</button>
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
                    "text-left p-1.5 border-r border-b border-hairline hover:bg-surface-muted/60 transition-colors",
                    !inMonth && "bg-surface-muted/30 text-ink-faint",
                    isSel && "bg-primary-soft/40",
                  )}
                >
                  <div className={cn("text-xs font-medium mb-1", isSel && "text-primary")}>{format(day, "d")}</div>
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

        <div className="rounded-lg bg-surface border border-hairline p-5 shadow-soft">
          <div className="text-eyebrow text-ink-muted">Agenda</div>
          <div className="text-title text-ink mt-1">{format(selected, "EEEE, MMM d")}</div>
          {selectedEvents.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No events on this day.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {selectedEvents.map((e) => (
                <li key={e.id} className="rounded-md border border-hairline p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{e.title}</span>
                    <EventKindBadge kind={e.kind} />
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">{format(parseISO(e.starts_at), "HH:mm")}{e.ends_at ? ` – ${format(parseISO(e.ends_at), "HH:mm")}` : ""}</div>
                  {e.location && <div className="text-xs text-ink-muted mt-0.5">{e.location}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
