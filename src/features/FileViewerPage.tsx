"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getDocument } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileText, FileSpreadsheet, FileImage, FileCode, FileVideo, FileAudio, FileArchive, FileIcon, Loader2, ExternalLink, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { fileSize, formatDate } from "@/lib/format";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getFileIcon(name: string, mime: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <FileImage className="h-16 w-16 text-pink-500" strokeWidth={1.5} />;
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return <FileText className="h-16 w-16 text-rose-500" strokeWidth={1.5} />;
  }
  if (["xlsx", "xls", "csv", "ods"].includes(ext) || mime.includes("excel") || mime.includes("spreadsheet") || mime === "text/csv") {
    return <FileSpreadsheet className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />;
  }
  if (["docx", "doc", "rtf", "odt"].includes(ext) || mime.includes("word") || mime.includes("officedocument.wordprocessingml")) {
    return <FileText className="h-16 w-16 text-blue-500" strokeWidth={1.5} />;
  }
  if (["pptx", "ppt", "odp"].includes(ext) || mime.includes("presentation") || mime.includes("powerpoint")) {
    return <FileIcon className="h-16 w-16 text-orange-500" strokeWidth={1.5} />;
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) {
    return <FileArchive className="h-16 w-16 text-yellow-500" strokeWidth={1.5} />;
  }
  if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext) || mime.startsWith("video/")) {
    return <FileVideo className="h-16 w-16 text-purple-500" strokeWidth={1.5} />;
  }
  if (["mp3", "wav", "ogg", "flac"].includes(ext) || mime.startsWith("audio/")) {
    return <FileAudio className="h-16 w-16 text-indigo-500" strokeWidth={1.5} />;
  }
  if (["html", "css", "js", "ts", "json", "xml", "md"].includes(ext) || mime.includes("javascript") || mime.includes("json")) {
    return <FileCode className="h-16 w-16 text-sky-500" strokeWidth={1.5} />;
  }
  
  return <FileIcon className="h-16 w-16 text-ink-muted" strokeWidth={1.5} />;
}

export function FileViewerPage({ id, publicMode = false }: { id: string; publicMode?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);
  const { data: doc, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          {t("documents.viewer.loading")}
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <AppShell publicMode={publicMode}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-ink">{t("documents.viewer.notFound")}</h2>
          <p className="text-sm text-ink-muted mt-1 max-w-sm">
            {t("documents.viewer.notFoundDesc", "We couldn't retrieve the requested document. It might have been deleted or the link is invalid.")}
          </p>
          {!publicMode && (
            <button
              onClick={() => router.push("/documents")}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-active transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("documents.viewer.back")}
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  const publicUrl = doc.storage_path
    ? supabase.storage.from("documents").getPublicUrl(doc.storage_path).data.publicUrl
    : "";

  const isImage = doc.mime?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(doc.name);

  return (
    <AppShell publicMode={publicMode}>
      <div className="max-w-2xl mx-auto py-6">

        {/* Info Card */}
        <div className="bg-surface rounded-xl border border-hairline p-5 sm:p-8 shadow-soft flex flex-col items-center text-center">
          <div className="h-36 w-36 rounded-2xl bg-surface-muted/50 border border-hairline flex items-center justify-center mb-6 overflow-hidden">
            {isImage && publicUrl ? (
              <img src={publicUrl} alt={doc.name} className="h-full w-full object-contain" />
            ) : (
              getFileIcon(doc.name, doc.mime || "")
            )}
          </div>

          <h1 className="text-xl font-bold text-ink max-w-full break-all" title={doc.name}>
            {doc.name}
          </h1>
          
          {doc.description && (
            <p className="text-sm text-ink-muted mt-2 max-w-md italic">
              "{doc.description}"
            </p>
          )}

          <div className="w-full border-t border-hairline my-6 pt-6 grid grid-cols-2 gap-y-4 gap-x-6 text-left text-sm">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">{t("documents.viewer.size")}</span>
              <span className="font-medium text-ink mt-0.5 block">{fileSize(doc.size)}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">{t("documents.viewer.uploaded")}</span>
              <span className="font-medium text-ink mt-0.5 block">{formatDate(doc.created_at)}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">MIME Type</span>
              <span className="font-medium text-ink mt-0.5 block truncate" title={doc.mime || "unknown"}>
                {doc.mime || "unknown"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">{t("documents.viewer.version")}</span>
              <span className="font-medium text-ink mt-0.5 block">v{doc.version}</span>
            </div>
            {publicMode && (
              <div className="col-span-2 border-t border-hairline pt-4">
                <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">Access Status</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 mt-1 inline-flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {t("documents.viewer.publicSharedLink", "Public Shared Link")}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full mt-2">
            {!publicMode && (
              <button
                onClick={() => router.push("/documents")}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("documents.viewer.back")}
              </button>
            )}
             {doc.storage_path && (
              <>
                <button
                  onClick={() => {
                    const url = supabase.storage.from("documents").getPublicUrl(doc.storage_path!).data.publicUrl;
                    window.open(url, "_blank", "noreferrer");
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("documents.viewer.open")}
                </button>
                <button
                  onClick={() => setDownloadConfirmOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t("documents.viewer.download")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Dialog open={downloadConfirmOpen} onOpenChange={setDownloadConfirmOpen}>
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
              <span className="font-semibold text-ink break-all block mt-1">{doc.name}</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setDownloadConfirmOpen(false)}
                className="h-9 px-3.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const url = supabase.storage.from("documents").getPublicUrl(doc.storage_path!).data.publicUrl;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.setAttribute("download", doc.name);
                    link.style.display = "none";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (e) {
                    console.error(e);
                    // Fallback
                    const url = supabase.storage.from("documents").getPublicUrl(doc.storage_path!).data.publicUrl;
                    window.open(url, "_blank");
                  }
                  setDownloadConfirmOpen(false);
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
