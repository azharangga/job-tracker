import { format as fmt, formatDistanceToNow, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";

function parseDateLocal(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return parseISO(iso);
}

export function formatCurrency(
  min?: number | null,
  max?: number | null,
  currency: string | null = "IDR",
): string {
  if (min == null && max == null) return "-";
  const f = (n: number) => {
    if (currency === "IDR") {
      if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
      if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}k`;
      return `Rp${n}`;
    }
    return `${currency ?? ""} ${n.toLocaleString("id-ID")}`;
  };
  if (min != null && max != null) return `${f(min)} - ${f(max)}`;
  return f((min ?? max) as number);
}

export function formatDate(iso: string | null | undefined, pattern?: string) {
  if (!iso) return "-";
  try {
    return fmt(parseDateLocal(iso), pattern ?? "d MMM yyyy", { locale: localeID });
  } catch {
    return "-";
  }
}

export function formatDateWIB(date: Date, pattern: string) {
  return fmt(date, pattern, { locale: localeID });
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "-";
  try {
    return formatDistanceToNow(parseDateLocal(iso), { locale: localeID, addSuffix: true });
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
