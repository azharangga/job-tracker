import { cn } from "@/lib/utils";

type StickerColor =
  | "sky"
  | "purple"
  | "pink"
  | "orange"
  | "teal"
  | "green"
  | "brown"
  | "red"
  | "amber"
  | "muted";

const map: Record<StickerColor, { bg: string; text: string; dot: string }> = {
  sky: {
    bg: "bg-sticker-sky",
    text: "text-white font-semibold",
    dot: "bg-white/70",
  },
  purple: {
    bg: "bg-sticker-purple",
    text: "text-white",
    dot: "bg-white/70",
  },
  pink: {
    bg: "bg-sticker-pink",
    text: "text-white",
    dot: "bg-white/70",
  },
  orange: {
    bg: "bg-sticker-orange",
    text: "text-white",
    dot: "bg-white/70",
  },
  teal: {
    bg: "bg-sticker-teal",
    text: "text-white",
    dot: "bg-white/70",
  },
  green: {
    bg: "bg-sticker-green",
    text: "text-white",
    dot: "bg-white/70",
  },
  brown: {
    bg: "bg-sticker-brown",
    text: "text-white",
    dot: "bg-white/70",
  },
  red: {
    bg: "bg-sticker-red",
    text: "text-white",
    dot: "bg-white/70",
  },
  amber: {
    bg: "bg-sticker-amber",
    text: "text-white",
    dot: "bg-white/70",
  },
  muted: {
    bg: "bg-muted",
    text: "text-ink-muted",
    dot: "bg-ink-faint",
  },
};

export function StickerBadge({
  color,
  children,
  size = "sm",
  dot = false,
  className,
}: {
  color: StickerColor;
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}) {
  const c = map[color];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        c.bg,
        c.text,
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />}
      {children}
    </span>
  );
}
