import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-hairline bg-surface/50 py-16 px-6 text-center",
        className,
      )}
    >
      {icon && <div className="text-ink-faint text-3xl">{icon}</div>}
      <h3 className="text-title text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ShimmerBar({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}
