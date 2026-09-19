"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";
import { FormDialog } from "./FormDialog";
import { saveApplicationStages } from "@/services";
import { DEFAULT_APPLICATION_STAGES } from "@/constants";
import type { ApplicationStage } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  currentStages: ApplicationStage[];
}

interface Item {
  id: string;
  key: string;
  label: string;
}

function SortableItem({ item, onEdit, onRemove }: { item: Item; onEdit: (id: string, val: string) => void; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-2 bg-surface border border-hairline rounded-md mb-2 ${isDragging ? "opacity-70 shadow-elevated" : ""}`}>
      <button type="button" {...attributes} {...listeners} className="p-1 text-ink-faint hover:text-ink cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <input
        value={item.label}
        onChange={(e) => onEdit(item.id, e.target.value)}
        className="flex-1 h-8 px-2 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
        placeholder="Stage name"
      />
      <button type="button" onClick={() => onRemove(item.id)} className="p-1.5 text-ink-muted hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function StageManagerModal({ open, onOpenChange, applicationId, currentStages }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (open) {
      setItems(currentStages.map(s => ({ id: s.key || Math.random().toString(), key: s.key, label: s.label })));
    }
  }, [open, currentStages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    const r = Math.random().toString(36).substring(7);
    setItems([...items, { id: `custom_${r}`, key: `custom_${r}`, label: "New Stage" }]);
  };

  const handleRemove = (id: string) => {
    if (items.length <= 1) {
      toast.error(t("applications.stages.minError", { defaultValue: "Minimum 1 stage required" }));
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  const handleEdit = (id: string, label: string) => {
    setItems(items.map(i => i.id === id ? { ...i, label } : i));
  };

  const handleReset = () => {
    setItems(DEFAULT_APPLICATION_STAGES.map(s => ({ id: s.key, key: s.key, label: s.label })));
  };

  const mut = useMutation({
    mutationFn: () => saveApplicationStages(applicationId, items.map(i => ({ key: i.key, label: i.label }))),
    onSuccess: () => {
      toast.success(t("common.save", { defaultValue: "Saved successfully" }));
      void qc.invalidateQueries({ queryKey: ["application_stages", applicationId] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("applications.stages.title", { defaultValue: "Manage Timeline Stages" })}
      submitLabel={t("common.save")}
      onSubmit={async () => { await mut.mutateAsync(); }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-ink-muted">
            {t("applications.stages.desc", { defaultValue: "Drag to reorder. Rename or add new stages for this specific application." })}
          </p>
          <button type="button" onClick={handleReset} className="text-xs flex items-center gap-1 text-ink-muted hover:text-ink transition-colors">
            <RotateCcw className="h-3 w-3" /> {t("common.reset", { defaultValue: "Reset" })}
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItem key={item.id} item={item} onEdit={handleEdit} onRemove={handleRemove} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-1 py-2 border-2 border-dashed border-hairline rounded-md text-sm text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
        >
          <Plus className="h-4 w-4" /> {t("applications.stages.add", { defaultValue: "Add Stage" })}
        </button>
      </div>
    </FormDialog>
  );
}