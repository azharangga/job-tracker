import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const PALETTE = [
  "bg-sticker-sky/20 text-sticker-sky",
  "bg-primary-soft text-primary",
  "bg-sticker-pink/20 text-sticker-pink",
  "bg-sticker-orange/20 text-sticker-orange",
  "bg-sticker-teal/20 text-sticker-teal",
  "bg-sticker-green/20 text-sticker-green",
  "bg-sticker-brown/20 text-sticker-brown",
];

export function CompanyAvatar({
  name,
  logoUrl,
  size = 32,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = PALETTE[hash % PALETTE.length];
  const px = `${size}px`;
  const hasLogo = logoUrl && logoUrl !== "none" && logoUrl !== "null" && logoUrl.trim() !== "";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold overflow-hidden border border-hairline/60 shadow-sm",
        tone,
        className,
      )}
      style={{ width: px, height: px, fontSize: `${size * 0.4}px` }}
    >
      {hasLogo ? (
        <img src={logoUrl!} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
