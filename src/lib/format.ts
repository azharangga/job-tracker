import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatCurrency(
  min?: number | null,
  max?: number | null,
  currency: string | null = "IDR",
): string {
  if (min == null && max == null) return "-";
  const fmt = (n: number) => {
    if (currency === "IDR") {
      if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
      if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}k`;
      return `Rp${n}`;
    }
    return `${currency ?? ""} ${n.toLocaleString()}`;
  };
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export function formatDate(iso: string | null | undefined, pattern = "MMM d, yyyy") {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return "-";
  }
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "-";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "-";
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function fileSize(bytes?: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
