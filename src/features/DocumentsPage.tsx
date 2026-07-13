"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Trash2, Download, Pencil, ZoomIn, ZoomOut, RotateCcw, Share2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StickerBadge } from "@/components/common/StickerBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { listDocuments, createDocument, deleteDocument, uploadDocumentFile, updateDocument } from "@/services";
import { DOCUMENT_KIND_LABELS } from "@/constants";
import { fileSize, formatDate } from "@/lib/format";
import type { DocumentKind } from "@/types";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KIND_COLOR: Record<DocumentKind, "sky" | "purple" | "pink" | "orange" | "teal" | "green" | "brown" | "muted"> = {
  cv: "sky",
  cover_letter: "teal",
  portfolio: "orange",
  certificate: "green",
  transcript: "teal",
  photo: "pink",
  pdf: "sky",
  spreadsheet: "green",
  word: "sky",
  powerpoint: "orange",
  other: "muted",
};

export function DocumentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const router = useRouter();
  const auth = useAuth();
  const { data = [] } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const [filter, setFilter] = useState<DocumentKind | "all">("all");
  
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kind, setKind] = useState<DocumentKind>("cv");
  const [version, setVersion] = useState(1);
  const [description, setDescription] = useState("");
  
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [downloadDoc, setDownloadDoc] = useState<any | null>(null);

  // Share Sheet States
  const [shareDoc, setShareDoc] = useState<any | null>(null);
  const [shareSheetNames, setShareSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Record<number, boolean>>({});
  const [isLoadingShareSheets, setIsLoadingShareSheets] = useState(false);

  // Edit states
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editKind, setEditKind] = useState<DocumentKind>("cv");
  const [editVersion, setEditVersion] = useState(1);
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Preview States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewMime, setPreviewMime] = useState("");
  const [previewStoragePath, setPreviewStoragePath] = useState("");
  const [zoom, setZoom] = useState(100);

  const items = filter === "all" ? data : data.filter((d) => d.kind === filter);

  const handleOpenPreview = async (name: string, path: string, mime: string) => {
    setPreviewName(name);
    setPreviewMime(mime);
    setPreviewStoragePath(path);
    setZoom(100);
    setPreviewOpen(true);

    const publicUrl = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
    setPreviewUrl(publicUrl);
  };
  
  const handleViewDocument = (d: (typeof data)[number]) => {
    const name = d.name;
    const mime = d.mime || "";
    const path = d.storage_path || "";
    if (!path) return;

    const isImage = mime.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name);
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
    const isSpreadsheet =
      mime === "text/csv" ||
      mime === "application/vnd.ms-excel" ||
      mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      /\.(xlsx|xls|csv)$/i.test(name);

    if (isImage) {
      handleOpenPreview(name, path, mime);
    } else if (isPdf) {
      router.push(`/documents/pdf/${d.id}`);
    } else if (isSpreadsheet) {
      router.push(`/documents/spreadsheet/${d.id}`);
    } else {
      router.push(`/documents/file/${d.id}`);
    }
  };

  const handleDownloadFile = async (storagePath: string, name: string) => {
    try {
      const publicUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;
      const res = await fetch(publicUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", name);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      // fallback
      try {
        const publicUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;
        window.open(publicUrl, "_blank");
      } catch (err) {
        toast.error("Download failed.");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    setUploadProgress(0);
    try {
      const storagePath = await uploadDocumentFile(selectedFile, (p) => setUploadProgress(p));
      await createDocument({
        name: selectedFile.name,
        size: selectedFile.size,
        mime: selectedFile.type,
        kind,
        version,
        description: description || null,
        storage_path: storagePath,
      });
      toast.success(t("documents.created"));
      setOpenCreate(false);
      setSelectedFile(null);
      setVersion(1);
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleUpdate = async () => {
    if (!editDoc) return;
    setUploadProgress(0);
    try {
      let patch: any = {
        name: editName,
        kind: editKind,
        version: editVersion,
        description: editDescription || null,
      };

      if (editFile) {
        const storagePath = await uploadDocumentFile(editFile, (p) => setUploadProgress(p));
        if (editDoc.storage_path) {
          try {
            await supabase.storage.from("documents").remove([editDoc.storage_path]);
          } catch (err) {
            console.error("Failed to delete old storage file:", err);
          }
        }
        patch.storage_path = storagePath;
        patch.size = editFile.size;
        patch.mime = editFile.type;
      }

      await updateDocument(editDoc.id, patch);
      toast.success("Document updated successfully.");
      setEditDoc(null);
      setEditFile(null);
      void qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      const doc = data.find((d) => d.id === confirmId);
      if (doc?.storage_path) {
        await supabase.storage.from("documents").remove([doc.storage_path]);
      }
      await deleteDocument(confirmId);
      toast.success(t("documents.deleted"));
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleOpenShare = async (d: (typeof data)[number]) => {
    const name = d.name;
    const mime = d.mime || "";
    const isSpreadsheet =
      mime === "text/csv" ||
      mime === "application/vnd.ms-excel" ||
      mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      /\.(xlsx|xls|csv)$/i.test(name);

    setShareDoc(d);
    setShareSheetNames([]);
    setSelectedSheets({});

    if (!isSpreadsheet || !d.storage_path) {
      setIsLoadingShareSheets(false);
      return;
    }

    setIsLoadingShareSheets(true);

    try {
      const publicUrl = supabase.storage.from("documents").getPublicUrl(d.storage_path).data.publicUrl;
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error("Failed to download spreadsheet file");

      const ext = name.split(".").pop()?.toLowerCase() || "";
      if (ext === "csv") {
        setShareSheetNames(["CSV Data"]);
        setSelectedSheets({ 0: true });
      } else {
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { bookSheets: true });
        setShareSheetNames(workbook.SheetNames);
        const initialSelected: Record<number, boolean> = {};
        workbook.SheetNames.forEach((_, idx) => {
          initialSelected[idx] = true;
        });
        setSelectedSheets(initialSelected);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sheet list.");
      setShareDoc(null);
    } finally {
      setIsLoadingShareSheets(false);
    }
  };

  const isShareDocSpreadsheet = shareDoc && (
    shareDoc.mime === "text/csv" ||
    shareDoc.mime === "application/vnd.ms-excel" ||
    shareDoc.mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    /\.(xlsx|xls|csv)$/i.test(shareDoc.name)
  );

  return (
    <AppShell>
      <PageHeader
        title={t("documents.title")}
        description={t("documents.description")}
        count={data.length}
        actions={
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" strokeWidth={2} />
            {t("documents.upload")}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>{t("documents.filter.all")}</FilterChip>
        {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((k) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>{DOCUMENT_KIND_LABELS[k]}</FilterChip>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((d) => (
            <div key={d.id} className="rounded-lg bg-surface border border-hairline p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-ink-muted/10 text-ink grid place-items-center shrink-0">
                    <FileText className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleViewDocument(d)}
                      className="text-sm font-semibold text-ink hover:text-primary transition-colors truncate text-left w-full cursor-pointer block"
                      title={d.name}
                    >
                      {d.name}
                    </button>
                    <div className="text-xs text-ink-muted mt-0.5">{fileSize(d.size)}</div>
                  </div>
                </div>
                {d.description && (
                  <p className="mt-2.5 text-xs text-ink-muted line-clamp-2">
                    {d.description}
                  </p>
                )}
              </div>
              <div className="mt-3.5 pt-3 border-t border-hairline flex items-center justify-between text-xs">
                <StickerBadge color="muted" size="sm" dot={false}>
                  {DOCUMENT_KIND_LABELS[d.kind]}
                </StickerBadge>
                <div className="flex items-center gap-1.5">
                  {d.storage_path && (
                    <>
                      <button
                        onClick={() => setDownloadDoc(d)}
                        className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleOpenShare(d)}
                        className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title={t("documents.share", "Share")}
                      >
                        <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditDoc(d);
                      setEditName(d.name);
                      setEditKind(d.kind);
                      setEditVersion(d.version);
                      setEditDescription(d.description || "");
                      setEditFile(null);
                    }}
                    className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface text-ink hover:bg-surface-muted transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setConfirmId(d.id)}
                    className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <FormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t("documents.upload")}
        onSubmit={handleUpload}
        submitLabel={t("documents.upload")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.kind")}
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DocumentKind)}
              className="w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((k) => (
                <option key={k} value={k}>
                  {DOCUMENT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.file")}
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-hairline file:text-xs file:font-semibold file:bg-surface file:text-ink hover:file:bg-surface-muted cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CV for UI/UX Designer role"
              className="w-full h-20 rounded-md border border-hairline bg-surface p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {uploadProgress !== null && (
            <div className="w-full space-y-1.5 pt-2 border-t border-hairline">
              <div className="flex justify-between text-xs font-semibold text-ink-muted">
                <span>Mengunggah file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-surface-muted border border-hairline rounded-full h-2 overflow-hidden p-[1px]">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-200" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={editDoc !== null}
        onOpenChange={(open) => !open && setEditDoc(null)}
        title={t("documents.edit")}
        onSubmit={handleUpdate}
        submitLabel={t("common.save", "Save Changes")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.name")}
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.kind")}
            </label>
            <select
              value={editKind}
              onChange={(e) => setEditKind(e.target.value as DocumentKind)}
              className="w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((k) => (
                <option key={k} value={k}>
                  {DOCUMENT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.version")}
            </label>
            <input
              type="number"
              value={editVersion}
              onChange={(e) => setEditVersion(Number(e.target.value))}
              min={1}
              className="w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.replaceFile")}
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setEditFile(file);
                if (file) {
                  setEditName(file.name);
                }
              }}
              className="w-full text-sm text-ink-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-hairline file:text-xs file:font-semibold file:bg-surface file:text-ink hover:file:bg-surface-muted cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              {t("documents.form.description")}
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-20 rounded-md border border-hairline bg-surface p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {uploadProgress !== null && (
            <div className="w-full space-y-1.5 pt-2 border-t border-hairline">
              <div className="flex justify-between text-xs font-semibold text-ink-muted">
                <span>Mengunggah file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-surface-muted border border-hairline rounded-full h-2 overflow-hidden p-[1px]">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-200" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        onConfirm={handleDelete}
        title={t("documents.deleted")}
        description={t("documents.deleteConfirm")}
      />

      {/* Image Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] h-[85vh] flex flex-col p-6 gap-4">
          <DialogHeader className="border-b border-hairline pb-3 shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-semibold text-ink truncate max-w-[50vw]" title={previewName}>
              {previewName}
            </DialogTitle>
            {previewUrl && (
              <div className="flex items-center gap-1.5 mr-6">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="h-8 w-8 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono text-ink-muted w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(300, z + 25))}
                  className="h-8 w-8 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="h-8 w-8 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDownloadDoc({ storage_path: previewStoragePath, name: previewName } as any)}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-active cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 w-full overflow-auto flex items-center justify-center bg-surface-muted/50 rounded-lg border border-hairline p-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={previewName}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                className="max-h-[65vh] object-contain max-w-full transition-transform duration-200 animate-fade-in"
              />
            ) : (
              <div className="text-sm text-ink-muted flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading preview...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Document Modal */}
      <Dialog open={!!shareDoc} onOpenChange={(open) => { if (!open) setShareDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              {t("documents.shareModal.title", "Share Document")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-ink-secondary">
              <span className="font-semibold text-ink break-all block mb-1">{shareDoc?.name}</span>
              {isShareDocSpreadsheet 
                ? t("documents.shareModal.desc", "Choose which sheets you want to share with the public:")
                : t("documents.shareModal.descGeneric", "Generate a public share link to allow anyone to view this file:")}
            </div>

            {isShareDocSpreadsheet && (
              isLoadingShareSheets ? (
                <div className="h-28 flex flex-col items-center justify-center gap-2 border border-hairline rounded-lg bg-surface-muted/30">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs text-ink-muted">{t("documents.shareModal.loadingSheets", "Loading sheet list...")}</span>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-hairline rounded-lg divide-y divide-hairline bg-surface custom-scrollbar">
                  {shareSheetNames.map((name, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-muted cursor-pointer transition-colors text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedSheets[idx]}
                        onChange={(e) => {
                          setSelectedSheets((prev) => ({
                            ...prev,
                            [idx]: e.target.checked,
                          }));
                        }}
                        className="h-4 w-4 rounded border-hairline text-primary focus:ring-primary focus:ring-1 cursor-pointer"
                      />
                      <span className="text-ink font-medium select-none truncate">{name}</span>
                    </label>
                  ))}
                </div>
              )
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setShareDoc(null)}
                className="h-9 px-3.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={isLoadingShareSheets || (isShareDocSpreadsheet && !Object.values(selectedSheets).some(Boolean))}
                onClick={() => {
                  if (!shareDoc) return;
                  let shareUrl = `${window.location.origin}/share/document/${shareDoc.id}`;
                  
                  const authUser = auth?.user;
                  let hasQuery = false;
                  if (authUser) {
                    let avatar = authUser.avatar_url || "";
                    const marker = "/public/avatars/";
                    const mIdx = avatar.indexOf(marker);
                    if (mIdx !== -1) {
                      avatar = avatar.substring(mIdx + marker.length);
                    }
                    if (avatar.endsWith("_cropped.jpg")) {
                      avatar = avatar.replace("_cropped.jpg", "");
                    }
                    const rawInfo = `${authUser.name.trim()}|${avatar}`;
                    const uToken = btoa(unescape(encodeURIComponent(rawInfo)))
                      .replace(/=/g, "")
                      .replace(/\+/g, "-")
                      .replace(/\//g, "_");
                    shareUrl += `?u=${uToken}`;
                    hasQuery = true;
                  }

                  if (isShareDocSpreadsheet) {
                    const selectedIndices = Object.entries(selectedSheets)
                      .filter(([_, checked]) => checked)
                      .map(([idx]) => idx)
                      .join(",");
                    const token = btoa(selectedIndices).replace(/=/g, "");
                    shareUrl += `${hasQuery ? "&" : "?"}v=${token}`;
                  }

                  void navigator.clipboard.writeText(shareUrl);
                  toast.success(t("documents.shareCopied", "Share link copied to clipboard!"));
                  setShareDoc(null);
                }}
                className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors cursor-pointer disabled:opacity-50 disabled:hover:bg-primary"
              >
                {t("documents.shareModal.copyLink", "Copy Link")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Confirmation Dialog */}
      <Dialog open={downloadDoc !== null} onOpenChange={(open) => !open && setDownloadDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t("documents.downloadModal.title", "Download Document")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-ink-secondary">
              {t("documents.downloadModal.desc", "Are you sure you want to download this file?")}
              <span className="font-semibold text-ink break-all block mt-1">{downloadDoc?.name}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setDownloadDoc(null)}
                className="h-9 px-3.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (downloadDoc?.storage_path) {
                    handleDownloadFile(downloadDoc.storage_path, downloadDoc.name);
                  }
                  setDownloadDoc(null);
                }}
                className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors cursor-pointer"
              >
                {t("documents.viewer.download", "Download")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${active ? "bg-ink text-background" : "bg-surface border border-hairline text-ink-secondary hover:bg-surface-muted"}`}>
      {children}
    </button>
  );
}
