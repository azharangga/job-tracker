"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getDocument } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Filter, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { fileSize, formatDate } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";

interface SheetData {
  name: string;
  rows: string[][];
}

interface TableState {
  currentPage: number;
  checkboxFilters: Record<number, Set<string>>;
  tempCheckboxFilters: Record<number, Set<string>>;
  dropdownSearch: Record<number, string>;
  sortConfig: { colIndex: number; direction: "asc" | "desc" } | null;
  globalSearch: string;
  globalSearchInput: string;
  activeDropdownCol: number | null;
}

const INITIAL_TABLE_STATE: TableState = {
  currentPage: 1,
  checkboxFilters: {},
  tempCheckboxFilters: {},
  dropdownSearch: {},
  sortConfig: null,
  globalSearch: "",
  globalSearchInput: "",
  activeDropdownCol: null,
};

// RFC-4180 compliant CSV Parser
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(currentVal);
        currentVal = "";
      } else if (char === "\n" || char === "\r") {
        row.push(currentVal);
        currentVal = "";
        if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
          result.push(row);
        }
        row = [];
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal);
    result.push(row);
  }
  return result;
}

export function SpreadsheetViewerPage({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  const { data: doc, isLoading: isDocLoading, error: docError } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isParsingWorkbook, setIsParsingWorkbook] = useState(false);

  // Grouped table states for instant batch updates and single-frame renders
  const [tableState, setTableState] = useState<TableState>(INITIAL_TABLE_STATE);
  
  // Separate responsive input bindings
  const [dropdownSearchInput, setDropdownSearchInput] = useState("");
  const [pageSize, setPageSize] = useState(25);

  const publicUrl = doc?.storage_path
    ? supabase.storage.from("documents").getPublicUrl(doc.storage_path).data.publicUrl
    : "";

  // Click away listener for filter dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTableState((prev) => ({ ...prev, activeDropdownCol: null }));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounce global search input to prevent UI lag
  useEffect(() => {
    const handler = setTimeout(() => {
      setTableState((prev) => ({
        ...prev,
        globalSearch: prev.globalSearchInput,
        currentPage: 1,
      }));
    }, 250);
    return () => clearTimeout(handler);
  }, [tableState.globalSearchInput]);

  // Debounce dropdown inner search input
  useEffect(() => {
    if (tableState.activeDropdownCol === null) return;
    const colIdx = tableState.activeDropdownCol;
    const handler = setTimeout(() => {
      setTableState((prev) => ({
        ...prev,
        dropdownSearch: {
          ...prev.dropdownSearch,
          [colIdx]: dropdownSearchInput,
        },
      }));
    }, 180);
    return () => clearTimeout(handler);
  }, [dropdownSearchInput, tableState.activeDropdownCol]);

  // Download and parse workbook with stream progress tracking to keep UI completely responsive
  useEffect(() => {
    if (!publicUrl) return;

    let active = true;
    const fetchAndParse = async () => {
      setIsParsing(true);
      setDownloadProgress(0);
      setIsParsingWorkbook(false);
      setParseError(null);
      try {
        const res = await fetch(publicUrl);
        if (!res.ok) throw new Error("Failed to download spreadsheet file");

        const contentLength = res.headers.get("content-length");
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        const reader = res.body?.getReader();
        if (!reader) {
          const buffer = await res.arrayBuffer();
          if (!active) return;
          setIsParsingWorkbook(true);
          await new Promise((resolve) => setTimeout(resolve, 30));
          const workbook = XLSX.read(buffer, { type: "array" });
          const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
            const worksheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
              header: 1,
              defval: "",
            }) as string[][];
            return { name, rows };
          });
          setSheets(parsedSheets);
          return;
        }

        let loadedBytes = 0;
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            if (totalBytes > 0) {
              setDownloadProgress(Math.round((loadedBytes / totalBytes) * 100));
            }
          }
        }

        if (!active) return;

        const allChunks = new Uint8Array(loadedBytes);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }

        setIsParsingWorkbook(true);
        // Yield to browser execution queue so parsing spinner starts spinning before freezing on CPU execution
        await new Promise((resolve) => setTimeout(resolve, 50));

        const ext = doc?.name.split(".").pop()?.toLowerCase() || "";
        if (ext === "csv") {
          const text = new TextDecoder().decode(allChunks);
          const parsed = parseCSV(text);
          setSheets([{ name: "CSV Data", rows: parsed }]);
        } else {
          const workbook = XLSX.read(allChunks, { type: "array" });
          const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
            const worksheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
              header: 1,
              defval: "",
            }) as string[][];
            return { name, rows };
          });
          setSheets(parsedSheets);
        }
      } catch (err) {
        console.error(err);
        if (active) setParseError((err as Error).message || "Failed to parse file.");
      } finally {
        if (active) setIsParsing(false);
      }
    };

    void fetchAndParse();

    return () => {
      active = false;
    };
  }, [publicUrl, doc?.name]);

  // Current sheet data
  const currentSheet = sheets[activeSheetIndex];
  
  const headers = useMemo(() => {
    if (!currentSheet || currentSheet.rows.length === 0) return [];
    return currentSheet.rows[0];
  }, [currentSheet]);

  const bodyRows = useMemo(() => {
    if (!currentSheet || currentSheet.rows.length <= 1) return [];
    return currentSheet.rows.slice(1);
  }, [currentSheet]);

  // Identify duplicate Native row index columns to hide them (e.g. No, NO, No., #, Nomor)
  const numberColIndices = useMemo(() => {
    const indices = new Set<number>();
    headers.forEach((hdr, idx) => {
      const name = String(hdr || "").trim().toLowerCase();
      if (
        name === "no" ||
        name === "no." ||
        name === "no_" ||
        name === "no_id" ||
        name === "no id" ||
        name === "#" ||
        name === "nomor"
      ) {
        indices.add(idx);
      }
    });
    return indices;
  }, [headers]);

  // LAZY: Precompute unique values in active column ONLY when opened
  const activeColUniqueValues = useMemo(() => {
    if (tableState.activeDropdownCol === null || !bodyRows.length) return [];
    const colIdx = tableState.activeDropdownCol;
    const vals = new Set<string>();
    bodyRows.forEach((row) => {
      const val = String(row[colIdx] === undefined ? "" : row[colIdx]).trim();
      vals.add(val || "(Blanks)");
    });
    return Array.from(vals).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [tableState.activeDropdownCol, bodyRows]);

  // Filter unique values inside active dropdown
  const activeFilteredColVals = useMemo(() => {
    if (tableState.activeDropdownCol === null) return [];
    const searchQ = (tableState.dropdownSearch[tableState.activeDropdownCol] || "").toLowerCase();
    if (!searchQ) return activeColUniqueValues;
    return activeColUniqueValues.filter((v) => v.toLowerCase().includes(searchQ));
  }, [tableState.activeDropdownCol, activeColUniqueValues, tableState.dropdownSearch]);

  // Initialize temp filters when opening a dropdown
  const handleOpenDropdown = (colIdx: number) => {
    const colVals = (() => {
      const vals = new Set<string>();
      bodyRows.forEach((row) => {
        const val = String(row[colIdx] === undefined ? "" : row[colIdx]).trim();
        vals.add(val || "(Blanks)");
      });
      return Array.from(vals);
    })();

    setDropdownSearchInput("");
    setTableState((prev) => ({
      ...prev,
      activeDropdownCol: colIdx,
      tempCheckboxFilters: {
        ...prev.tempCheckboxFilters,
        [colIdx]: prev.checkboxFilters[colIdx]
          ? new Set(prev.checkboxFilters[colIdx])
          : new Set(colVals),
      },
      dropdownSearch: {
        ...prev.dropdownSearch,
        [colIdx]: "",
      },
    }));
  };

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let rows = [...bodyRows];

    // 1. Global Search
    if (tableState.globalSearch.trim()) {
      const q = tableState.globalSearch.toLowerCase();
      rows = rows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(q))
      );
    }

    // 2. Column Checkbox Filters
    const colFiltersApplied = Object.entries(tableState.checkboxFilters);
    if (colFiltersApplied.length > 0) {
      rows = rows.filter((row) =>
        colFiltersApplied.every(([colIdxStr, allowedSet]) => {
          const colIdx = parseInt(colIdxStr, 10);
          const rawVal = String(row[colIdx] === undefined ? "" : row[colIdx]).trim();
          const cellVal = rawVal || "(Blanks)";
          return allowedSet.has(cellVal);
        })
      );
    }

    // 3. Sorting
    if (tableState.sortConfig) {
      const { colIndex, direction } = tableState.sortConfig;
      rows.sort((a, b) => {
        const valA = String(a[colIndex] || "").trim();
        const valB = String(b[colIndex] || "").trim();
        
        // Attempt numeric comparison
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return direction === "asc" ? numA - numB : numB - numA;
        }

        return direction === "asc"
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: "base" });
      });
    }

    return rows;
  }, [bodyRows, tableState.globalSearch, tableState.checkboxFilters, tableState.sortConfig]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (tableState.currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, tableState.currentPage, pageSize]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;

  const handleSort = (colIndex: number, direction: "asc" | "desc") => {
    setTableState((prev) => ({
      ...prev,
      sortConfig: { colIndex, direction },
      currentPage: 1,
      activeDropdownCol: null,
    }));
  };

  const applyCheckboxFilter = (colIdx: number) => {
    const tempSet = tableState.tempCheckboxFilters[colIdx];
    const colVals = activeColUniqueValues;
    
    setTableState((prev) => {
      const nextCheckboxFilters = { ...prev.checkboxFilters };
      // If all items are selected, we can clear the filter for this column
      if (tempSet.size === colVals.length) {
        delete nextCheckboxFilters[colIdx];
      } else {
        nextCheckboxFilters[colIdx] = new Set(tempSet);
      }
      return {
        ...prev,
        checkboxFilters: nextCheckboxFilters,
        currentPage: 1,
        activeDropdownCol: null,
      };
    });
  };

  const clearCheckboxFilter = (colIdx: number) => {
    setTableState((prev) => {
      const nextCheckboxFilters = { ...prev.checkboxFilters };
      delete nextCheckboxFilters[colIdx];
      return {
        ...prev,
        checkboxFilters: nextCheckboxFilters,
        currentPage: 1,
        activeDropdownCol: null,
      };
    });
  };

  const toggleAllTempValues = (colIdx: number, checked: boolean) => {
    const searchQ = (tableState.dropdownSearch[colIdx] || "").toLowerCase();
    
    setTableState((prev) => {
      const currentSet = new Set(prev.tempCheckboxFilters[colIdx] || []);
      activeColUniqueValues.forEach((val) => {
        if (!searchQ || val.toLowerCase().includes(searchQ)) {
          if (checked) {
            currentSet.add(val);
          } else {
            currentSet.delete(val);
          }
        }
      });
      return {
        ...prev,
        tempCheckboxFilters: {
          ...prev.tempCheckboxFilters,
          [colIdx]: currentSet,
        },
      };
    });
  };

  const toggleTempValue = (colIdx: number, val: string) => {
    setTableState((prev) => {
      const currentSet = new Set(prev.tempCheckboxFilters[colIdx] || []);
      if (currentSet.has(val)) {
        currentSet.delete(val);
      } else {
        currentSet.add(val);
      }
      return {
        ...prev,
        tempCheckboxFilters: {
          ...prev.tempCheckboxFilters,
          [colIdx]: currentSet,
        },
      };
    });
  };

  const copyToClipboard = (text: string) => {
    const val = String(text).trim();
    if (!val) return;
    void navigator.clipboard.writeText(val);
    toast.success(`Copied cell: "${val}"`);
  };

  const handleSheetChange = (idx: number) => {
    setActiveSheetIndex(idx);
    setTableState(INITIAL_TABLE_STATE);
  };

  const isLoadingAll = isDocLoading || isParsing || (!docError && !parseError && sheets.length === 0);

  if (isLoadingAll) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm text-ink-muted">
            {t("documents.viewer.loading")}
          </p>
        </div>
      </AppShell>
    );
  }

  if (docError || parseError || !doc) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-4">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-ink">{t("documents.viewer.notFound")}</h2>
          <p className="text-sm text-ink-muted mt-1 max-w-sm">
            {parseError || t("documents.viewer.notFoundDesc")}
          </p>
          <button
            onClick={() => router.push("/documents")}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("documents.viewer.back")}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-hairline shrink-0">
          <div>
            <h1 className="text-xl font-bold text-ink mt-1.5 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[300px] md:max-w-[500px]">{doc.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mt-1">
              <span>{t("documents.viewer.size")}: {fileSize(doc.size)}</span>
              <span>•</span>
              <span>{t("documents.viewer.uploaded")}: {formatDate(doc.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={() => router.push("/documents")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("documents.viewer.back")}
            </button>
            {doc.storage_path && (
              <button
                onClick={() => {
                  const url = supabase.storage.from("documents").getPublicUrl(doc.storage_path!).data.publicUrl;
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", doc.name);
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                {t("documents.viewer.download")}
              </button>
            )}
          </div>
        </div>

        {/* Toolbar & Search Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 my-3 shrink-0">
          {/* Tabs for workbook sheets */}
          {sheets.length > 1 ? (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full sm:max-w-[55%]">
              {sheets.map((sh, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSheetChange(idx)}
                  className={`h-8 px-3.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                    activeSheetIndex === idx
                      ? "bg-ink text-background shadow-sm"
                      : "bg-surface border border-hairline text-ink-secondary hover:bg-surface-muted"
                  }`}
                >
                  {sh.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-medium text-ink-muted">Single sheet document</div>
          )}

          {/* Global Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {Object.keys(tableState.checkboxFilters).length > 0 && (
              <button
                onClick={() => setTableState((prev) => ({ ...prev, checkboxFilters: {} }))}
                className="h-9 px-3 flex items-center gap-1 text-xs border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-md cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear All Filters
              </button>
            )}
            <div className="relative flex-1 sm:w-64 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Global search..."
                value={tableState.globalSearchInput}
                onChange={(e) =>
                  setTableState((prev) => ({ ...prev, globalSearchInput: e.target.value }))
                }
                className="w-full h-9 pl-9 pr-8 rounded-md border border-hairline bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {tableState.globalSearchInput && (
                <button
                  onClick={() => setTableState((prev) => ({ ...prev, globalSearchInput: "" }))}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Spreadsheet Table Viewport (Scrolling & Sticky Headers) */}
        <div className="flex-1 min-h-0 w-full rounded-lg border border-hairline bg-surface overflow-auto relative shadow-inner select-text">
          {headers.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-ink-muted">
              <FileSpreadsheet className="h-10 w-10 text-ink-muted/50 mb-2" />
              <p className="text-sm">This sheet is empty</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse min-w-max">
              {/* Sticky Header */}
              <thead className="sticky top-0 bg-surface border-b border-hairline z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
                <tr>
                  {/* Custom index number column # */}
                  <th className="p-2 border-r border-hairline bg-surface-muted/50 text-center w-12 text-ink-muted font-normal select-none sticky left-0 z-20">
                    #
                  </th>
                  {headers.map((hdr, idx) => {
                    // Skip native No / ID columns
                    if (numberColIndices.has(idx)) return null;

                    const isSorted = tableState.sortConfig?.colIndex === idx;
                    const isFiltered = tableState.checkboxFilters[idx] !== undefined;
                    const tempSet = tableState.tempCheckboxFilters[idx] || new Set();
                    
                    const isAllChecked = tableState.activeDropdownCol === idx && activeFilteredColVals.length > 0
                      ? activeFilteredColVals.every((v) => tempSet.has(v))
                      : false;

                    return (
                      <th key={idx} className="p-2 border-r border-hairline font-semibold text-ink relative min-w-[150px]">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate pr-5" title={String(hdr)}>
                            {String(hdr) || `Column ${idx + 1}`}
                          </span>
                          
                          {/* Rich Dropdown Toggle Button */}
                          <button
                            onClick={() => handleOpenDropdown(idx)}
                            className={`h-6 w-6 rounded flex items-center justify-center border transition-all cursor-pointer ${
                              isFiltered || isSorted
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-surface-muted/50 hover:bg-surface border-hairline text-ink-muted hover:text-ink"
                            }`}
                            title="Filter & Sort"
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Dropdown Menu Container (Compact layout, max-h-28 checklist container) */}
                        {tableState.activeDropdownCol === idx && (
                          <div
                            ref={dropdownRef}
                            className="absolute top-full right-0 mt-1 bg-surface border border-hairline rounded-lg shadow-elevated p-2.5 z-50 text-left w-52 text-xs text-ink font-normal animate-fade-in"
                          >
                            {/* Sort Section */}
                            <div className="font-semibold text-[9px] text-ink-muted uppercase tracking-wider mb-1 pb-0.5 border-b border-hairline">
                              Sort
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2.5">
                              <button
                                onClick={() => handleSort(idx, "asc")}
                                className={`w-full text-left h-6 px-1.5 rounded hover:bg-surface-muted cursor-pointer flex items-center justify-between text-[11px] ${
                                  tableState.sortConfig?.colIndex === idx && tableState.sortConfig.direction === "asc"
                                    ? "bg-primary/5 text-primary font-medium"
                                    : ""
                                }`}
                              >
                                <span>{t("documents.viewer.sortAsc")}</span>
                                {tableState.sortConfig?.colIndex === idx && tableState.sortConfig.direction === "asc" && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                              </button>
                              <button
                                onClick={() => handleSort(idx, "desc")}
                                className={`w-full text-left h-6 px-1.5 rounded hover:bg-surface-muted cursor-pointer flex items-center justify-between text-[11px] ${
                                  tableState.sortConfig?.colIndex === idx && tableState.sortConfig.direction === "desc"
                                    ? "bg-primary/5 text-primary font-medium"
                                    : ""
                                }`}
                              >
                                <span>{t("documents.viewer.sortDesc")}</span>
                                {tableState.sortConfig?.colIndex === idx && tableState.sortConfig.direction === "desc" && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                              </button>
                            </div>

                            {/* Filter Section */}
                            <div className="font-semibold text-[9px] text-ink-muted uppercase tracking-wider mb-1 pb-0.5 border-b border-hairline">
                              Filter values
                            </div>
                            
                            {/* Search inner dropdown */}
                            <div className="relative mb-1.5">
                              <Search className="absolute left-1.5 top-1.5 h-3 w-3 text-ink-muted" />
                              <input
                                type="text"
                                placeholder={t("documents.viewer.searchColumn")}
                                value={dropdownSearchInput}
                                onChange={(e) => setDropdownSearchInput(e.target.value)}
                                className="w-full h-6 pl-6 pr-2 border border-hairline rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-[10px]"
                              />
                            </div>

                            {/* Checklist Container (Reduced to max-h-28 to prevent dropdown height overflow) */}
                            <div className="max-h-28 overflow-y-auto border border-hairline rounded bg-surface-muted/30 p-1 mb-2.5 space-y-0.5">
                              <label className="flex items-center gap-1.5 p-0.5 hover:bg-surface rounded cursor-pointer select-none text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={isAllChecked}
                                  onChange={(e) => toggleAllTempValues(idx, e.target.checked)}
                                  className="rounded border-hairline text-primary focus:ring-primary h-3 w-3"
                                />
                                <span className="font-semibold">(Select All)</span>
                              </label>

                              {activeFilteredColVals.length === 0 ? (
                                <div className="text-[10px] text-ink-muted p-1 text-center">
                                  No matches
                                </div>
                              ) : (
                                activeFilteredColVals.map((val) => (
                                  <label
                                    key={val}
                                    className="flex items-center gap-1.5 p-0.5 hover:bg-surface rounded cursor-pointer select-none text-[11px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={tempSet.has(val)}
                                      onChange={() => toggleTempValue(idx, val)}
                                      className="rounded border-hairline text-primary focus:ring-primary h-3 w-3"
                                    />
                                    <span className="truncate">{val}</span>
                                  </label>
                                ))
                              )}
                            </div>

                            {/* Dropdown Action Buttons */}
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-hairline">
                              <button
                                onClick={() => clearCheckboxFilter(idx)}
                                className="flex-1 h-6 border border-hairline rounded hover:bg-surface-muted text-ink text-[10px] font-medium cursor-pointer"
                              >
                                {t("documents.viewer.clear")}
                              </button>
                              <button
                                onClick={() => applyCheckboxFilter(idx)}
                                className="flex-1 h-6 bg-primary hover:bg-primary-active rounded text-primary-foreground text-[10px] font-semibold cursor-pointer"
                              >
                                {t("documents.viewer.apply")}
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-hairline">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={headers.length + 1}
                      className="p-8 text-center text-ink-muted bg-surface-muted/10"
                    >
                      {t("documents.viewer.noRecords")}
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rowIdx) => {
                    const actualRowIdx = (tableState.currentPage - 1) * pageSize + rowIdx + 1;
                    return (
                      <tr key={rowIdx} className="hover:bg-surface-muted/30 group">
                        {/* Custom Row index column # */}
                        <td className="p-2 border-r border-hairline bg-surface-muted/20 text-center text-ink-muted select-none sticky left-0 z-10 bg-surface">
                          {actualRowIdx}
                        </td>
                        {headers.map((_, colIdx) => {
                          // Skip native No / ID columns
                          if (numberColIndices.has(colIdx)) return null;

                          const cellVal = row[colIdx] === undefined ? "" : String(row[colIdx]);
                          return (
                            <td
                              key={colIdx}
                              onClick={() => copyToClipboard(cellVal)}
                              className="p-2 border-r border-hairline truncate max-w-[240px] cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors relative"
                              title="Click to copy value"
                            >
                              {cellVal}
                              <Copy className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination & Status Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-3 border-t border-hairline shrink-0 text-xs text-ink-muted bg-surface-muted/10 px-1 mt-1 rounded-md">
          {/* Info Status */}
          <div>
            {t("documents.viewer.showing", {
              start: processedRows.length === 0 ? 0 : (tableState.currentPage - 1) * pageSize + 1,
              end: Math.min(tableState.currentPage * pageSize, processedRows.length),
              total: processedRows.length
            })}{" "}
            {processedRows.length !== bodyRows.length && (
              <span>{t("documents.viewer.filteredFrom", { total: bodyRows.length })}</span>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            {/* Page Size selector */}
            <div className="flex items-center gap-1.5">
              <span>{t("documents.viewer.rowsPerPage")}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setTableState((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="h-8 border border-hairline rounded bg-surface px-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-ink cursor-pointer"
              >
                {[10, 25, 50, 100, 250].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1">
              <button
                disabled={tableState.currentPage === 1}
                onClick={() => setTableState((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                className="h-8 w-8 grid place-items-center border border-hairline rounded bg-surface hover:bg-surface-muted text-ink disabled:opacity-40 disabled:hover:bg-surface cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                {t("documents.viewer.pageOf", {
                  current: tableState.currentPage,
                  total: totalPages
                })}
              </span>
              <button
                disabled={tableState.currentPage === totalPages}
                onClick={() => setTableState((prev) => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                className="h-8 w-8 grid place-items-center border border-hairline rounded bg-surface hover:bg-surface-muted text-ink disabled:opacity-40 disabled:hover:bg-surface cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
