import { APP_STATUS_LABELS, APP_STATUS_STICKER, PRIORITY_LABELS, PRIORITY_STICKER, EVENT_KIND_LABELS, EVENT_KIND_STICKER } from "@/constants";
import type { AppStatus, EventKind, Priority } from "@/types";
import { StickerBadge } from "./StickerBadge";

export function StatusBadge({ status, size = "sm" }: { status: AppStatus; size?: "sm" | "md" }) {
  return (
    <StickerBadge color={APP_STATUS_STICKER[status]} size={size}>
      {APP_STATUS_LABELS[status]}
    </StickerBadge>
  );
}

export function PriorityBadge({ priority, size = "sm" }: { priority: Priority; size?: "sm" | "md" }) {
  return (
    <StickerBadge color={PRIORITY_STICKER[priority]} size={size} dot={priority !== "low"}>
      {PRIORITY_LABELS[priority]}
    </StickerBadge>
  );
}

export function EventKindBadge({ kind, size = "sm" }: { kind: EventKind; size?: "sm" | "md" }) {
  return (
    <StickerBadge color={EVENT_KIND_STICKER[kind]} size={size}>
      {EVENT_KIND_LABELS[kind]}
    </StickerBadge>
  );
}
