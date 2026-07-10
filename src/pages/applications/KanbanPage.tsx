import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { PriorityBadge } from "@/components/common/badges";
import { listApplications, moveStatus } from "@/services";
import { APP_STATUS_LABELS, APP_STATUS_STICKER, KANBAN_COLUMNS } from "@/constants";
import type { Application, AppStatus } from "@/types";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function KanbanPage() {
  const qc = useQueryClient();
  const { t, i18n } = useTranslation();
  const { data = [] } = useQuery({ queryKey: ["applications"], queryFn: listApplications });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = KANBAN_COLUMNS.reduce<Record<AppStatus, Application[]>>((acc, s) => {
    acc[s] = data.filter((a) => a.status === s);
    return acc;
  }, {} as Record<AppStatus, Application[]>);

  const onDragEnd = async (e: DragEndEvent) => {
    const id = e.active.id as string;
    const next = e.over?.id as AppStatus | undefined;
    if (!next) return;
    const current = data.find((a) => a.id === id);
    if (!current || current.status === next) return;

    // Optimistic
    qc.setQueryData<Application[]>(["applications"], (prev) =>
      (prev ?? []).map((a) => (a.id === id ? { ...a, status: next } : a)),
    );
    try {
      await moveStatus(id, next);
      toast.success(
        i18n.language.startsWith("id")
          ? `Status dipindahkan ke ${APP_STATUS_LABELS[next]}`
          : `Moved to ${APP_STATUS_LABELS[next]}`
      );
    } catch (err) {
      toast.error((err as Error).message);
      void qc.invalidateQueries({ queryKey: ["applications"] });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("kanban.title")}
        description={t("kanban.description")}
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn key={col} status={col} apps={grouped[col]} />
          ))}
        </div>
      </DndContext>
    </AppShell>
  );
}

function KanbanColumn({ status, apps }: { status: AppStatus; apps: Application[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = APP_STATUS_STICKER[status];

  return (
    <div className="w-[280px] shrink-0 snap-start">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full bg-sticker-${color}`} />
          <span className="text-sm font-medium text-ink-secondary">{APP_STATUS_LABELS[status]}</span>
          <span className="text-xs text-ink-faint tabular-nums">{apps.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-lg bg-surface-muted/60 border border-dashed border-transparent p-2 min-h-[200px] transition-colors",
          isOver && "border-primary/40 bg-primary-soft/30",
        )}
      >
        <div className="space-y-2">
          {apps.map((a) => (
            <KanbanCard key={a.id} app={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <motion.div layout>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "rounded-md bg-surface border border-hairline p-3 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-elevated transition-shadow",
          isDragging && "opacity-70 rotate-1 shadow-elevated",
        )}
      >
        <div className="flex items-start gap-2.5">
          <CompanyAvatar name={app.company?.name ?? app.position} size={28} />
          <div className="flex-1 min-w-0">
            <Link
              to={`/applications/${app.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-ink hover:text-primary transition-colors truncate block"
            >
              {app.position}
            </Link>
            <div className="text-xs text-ink-muted truncate">{app.company?.name}</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {app.priority && app.priority !== "medium" && <PriorityBadge priority={app.priority} />}
          {app.platform && (
            <span className="text-[10px] text-ink-faint px-1.5 py-0.5 rounded bg-surface-muted">
              {app.platform}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
