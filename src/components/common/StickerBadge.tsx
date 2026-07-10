import { cn } from "@/lib/utils";

type StickerColor =
  | "sky"
  | "purple"
  | "pink"
  | "orange"
  | "teal"
  | "green"
  | "brown"
  | "muted";

const map: Record<StickerColor, { bg: string; text: string; dot: string }> = {
  sky: {
    bg: "bg-sticker-sky/15",
    text: "text-sticker-sky",
    dot: "bg-sticker-sky",
  },
  purple: {
    bg: "bg-sticker-purple/20",
    text: "text-sticker-purple",
    dot: "bg-sticker-purple",
  },
  pink: {
    bg: "bg-sticker-pink/15",
    text: "text-sticker-pink",
    dot: "bg-sticker-pink",
  },
  orange: {
    bg: "bg-sticker-orange/15",
    text: "text-sticker-orange",
    dot: "bg-sticker-orange",
  },
  teal: {
    bg: "bg-sticker-teal/15",
    text: "text-sticker-teal",
    dot: "bg-sticker-teal",
  },
  green: {
    bg: "bg-sticker-green/15",
    text: "text-sticker-green",
    dot: "bg-sticker-green",
  },
  brown: {
    bg: "bg-sticker-brown/15",
    text: "text-sticker-brown",
    dot: "bg-sticker-brown",
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
  dot = true,
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
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />}
      {children}
    </span>
  );
}
