"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface DataPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataPagination({ total, page, pageSize, pageSizeOptions = [5, 10, 25, 50, 100, 1000], onPageChange, onPageSizeChange }: DataPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const maxVisible = 5;

  const pages: (number | "...")[] = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(2, page - half);
    let end = Math.min(totalPages - 1, page + half);
    if (page <= 3) {
      start = 2;
      end = maxVisible - 1;
    } else if (page >= totalPages - 2) {
      start = totalPages - (maxVisible - 2);
      end = totalPages - 1;
    }
    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-hairline p-4 sm:px-5 bg-surface rounded-b-lg">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="whitespace-nowrap hidden sm:inline">{t("pagination.rowsPerPage", { defaultValue: "Baris per halaman" })}</span>
        <span className="whitespace-nowrap sm:hidden">{t("pagination.page", { defaultValue: "Halaman" })}</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-[72px] rounded-md bg-surface border border-hairline text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap tabular-nums">
          {total === 0 ? t("pagination.noResults", { defaultValue: "0 hasil" }) : t("pagination.showingOf", { start, end, total, defaultValue: `${start}–${end} dari ${total}` })}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface text-ink hover:bg-surface-muted transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span
                key={`e-${idx}`}
                className="h-7 w-7 grid place-items-center text-xs text-ink-faint select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-7 min-w-7 px-1.5 rounded-md text-xs font-medium border transition-colors duration-150 cursor-pointer ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-surface border-hairline text-ink hover:bg-surface-muted"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface text-ink hover:bg-surface-muted transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
