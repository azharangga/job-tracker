import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Trash2, Download, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StickerBadge } from "@/components/common/StickerBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { listDocuments, createDocument, deleteDocument, uploadDocumentFile } from "@/services";
import { DOCUMENT_KIND_LABELS } from "@/constants";
import { fileSize, formatDate } from "@/lib/format";
import type { DocumentKind } from "@/types";
import { FormDialog } from "@/components/common/FormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
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
  other: "muted",
};

export function DocumentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const [filter, setFilter] = useState<DocumentKind | "all">("all");
  
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kind, setKind] = useState<DocumentKind>("cv");
  const [version, setVersion] = useState(1);
  const [description, setDescription] = useState("");
  
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Preview States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewMime, setPreviewMime] = useState("");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const items = filter === "all" ? data : data.filter((d) => d.kind === filter);

  const handleOpenPreview = async (name: string, path: string, mime: string) => {
    setPreviewName(name);
    setPreviewMime(mime);
    setPreviewContent(null);
    setPreviewOpen(true);

    const publicUrl = supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
    setPreviewUrl(publicUrl);

    const isText =
      mime.startsWith("text/") ||
      name.endsWith(".json") ||
      name.endsWith(".md") ||
      name.endsWith(".txt") ||
      mime === "application/json";

    if (isText) {
      setLoadingPreview(true);
      try {
        const res = await fetch(publicUrl);
        if (!res.ok) throw new Error("Failed to load text content");
        const text = await res.text();
        setPreviewContent(text);
      } catch (err) {
        setPreviewContent("Error loading content preview.");
        console.error(err);
      } finally {
        setLoadingPreview(false);
      }
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    try {
      const storagePath = await uploadDocumentFile(selectedFile);
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
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
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
                    <div className="text-sm font-medium text-ink truncate" title={d.name}>{d.name}</div>
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
                        onClick={() => handleOpenPreview(d.name, d.storage_path!, d.mime || "")}
                        className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title={t("common.view", "View")}
                      >
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <a
                        href={supabase.storage.from("documents").getPublicUrl(d.storage_path).data.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 w-7 grid place-items-center rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title="Download/Open"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </a>
                    </>
                  )}
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
              Document type
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
              File
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-hairline file:text-xs file:font-semibold file:bg-surface file:text-ink hover:file:bg-surface-muted cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CV for UI/UX Designer role"
              className="w-full h-20 rounded-md border border-hairline bg-surface p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        onConfirm={handleDelete}
        title={t("documents.deleted")}
        description="Are you sure you want to delete this document? This action is permanent."
      />

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] h-[85vh] flex flex-col p-6 gap-4">
          <DialogHeader className="border-b border-hairline pb-3 shrink-0">
            <DialogTitle className="text-base font-semibold text-ink truncate max-w-[85vw]" title={previewName}>
              {previewName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center bg-surface-muted/50 rounded-lg border border-hairline">
            {loadingPreview ? (
              <div className="text-sm text-ink-muted flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading preview...
              </div>
            ) : previewUrl ? (
              (() => {
                const isImage = previewMime.startsWith("image/");
                const isPdf = previewMime === "application/pdf";
                const isText =
                  previewMime.startsWith("text/") ||
                  previewName.endsWith(".json") ||
                  previewName.endsWith(".md") ||
                  previewName.endsWith(".txt") ||
                  previewMime === "application/json";

                if (isImage) {
                  return (
                    <img
                      src={previewUrl}
                      alt={previewName}
                      className="max-h-[65vh] object-contain max-w-full p-2 animate-fade-in"
                    />
                  );
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={previewUrl}
                      title={previewName}
                      className="w-full h-full border-none rounded-lg"
                    />
                  );
                }

                if (isText) {
                  return (
                    <pre className="w-full h-full p-4 overflow-auto text-xs font-mono whitespace-pre-wrap text-ink bg-surface select-text">
                      {previewContent}
                    </pre>
                  );
                }

                // Fallback for unsupported mime types (docx, zip, etc)
                return (
                  <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-surface border border-hairline shadow-soft flex items-center justify-center text-ink-muted">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">Preview not available</div>
                      <div className="text-xs text-ink-muted mt-1">This file type ({previewMime || "unknown"}) cannot be previewed directly in the browser.</div>
                    </div>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </a>
                  </div>
                );
              })()
            ) : null}
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
