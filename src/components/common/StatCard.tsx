import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.24, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "group relative rounded-lg bg-surface border border-hairline p-5",
        "shadow-soft hover:shadow-elevated transition-shadow",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-eyebrow text-ink-muted">{label}</span>
        {icon && <span className="text-ink-faint">{icon}</span>}
      </div>
      <div className="mt-3 text-h2 font-bold text-ink tabular-nums">{value}</div>
      {(hint || trend) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trend.positive ? "text-sticker-green" : "text-sticker-brown",
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {hint}
        </div>
      )}
    </motion.div>
  );
}
