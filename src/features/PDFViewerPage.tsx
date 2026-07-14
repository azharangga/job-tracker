"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getDocument } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileText, Loader2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { fileSize, formatDate } from "@/lib/format";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PDFViewerPage({ id, publicMode = false }: { id: string; publicMode?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);

  const { data: doc, isLoading: isDocLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  const isDataReady = !isDocLoading && doc && iframeLoaded;

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const updateProgress = (time: number) => {
      setProgress((prev) => {
        if (isDataReady) {
          if (prev >= 100) {
            setTimeout(() => setLoadingFinished(true), 150);
            return 100;
          }
          const delta = (time - lastTime) / 1000;
          const step = Math.max(0.5, (100 - prev) * 15 * delta);
          const next = prev + step;
          return next >= 100 ? 100 : next;
        } else {
          if (prev >= 99) {
            return 99;
          }
          const delta = (time - lastTime) / 1000;
          const remaining = 99 - prev;
          const rate = remaining > 70 ? 25 : remaining > 40 ? 12 : remaining > 15 ? 4 : 0.8;
          const step = rate * delta;
          return Math.min(prev + step, 99);
        }
      });
      
      lastTime = time;
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDataReady]);

  if (isDocLoading) {
    return (
      <AppShell publicMode={publicMode}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-ink-muted">{t("documents.viewer.loading")} ({Math.floor(progress)}%)</p>
        </div>
      </AppShell>
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

  return (
    <AppShell publicMode={publicMode}>
      {!loadingFinished && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-ink-muted">{t("documents.viewer.loading")} ({Math.floor(progress)}%)</p>
        </div>
      )}
      <div className={`flex flex-col h-[calc(100vh-6rem)] ${!loadingFinished ? "hidden" : ""}`}>
        <div className="flex flex-col gap-2 pb-4 border-b border-hairline shrink-0">
          {/* Row 1: Title and Actions */}
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-ink mt-1.5 flex items-start gap-2 break-words min-w-0 flex-1">
              <FileText className="h-5 w-5 text-ink-muted shrink-0 mt-1" />
              <span className="break-all">{doc.name}</span>
            </h1>
            <div className="flex items-center gap-2 shrink-0 mt-1.5">
              {!publicMode && (
                <button
                  onClick={() => router.push("/documents")}
                  className="inline-flex items-center justify-center gap-1.5 h-9 w-9 md:w-auto md:px-3.5 rounded-md border border-hairline bg-surface hover:bg-surface-muted text-ink text-sm font-medium transition-colors cursor-pointer"
                  title={t("documents.viewer.back")}
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{t("documents.viewer.back")}</span>
                </button>
              )}
              {doc.storage_path && (
                <button
                  onClick={() => setDownloadConfirmOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 h-9 w-9 md:w-auto md:px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
                  title={t("documents.viewer.download")}
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{t("documents.viewer.download")}</span>
                </button>
              )}
            </div>
          </div>
          {/* Row 2: Metadata details */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{t("documents.viewer.size")}: {fileSize(doc.size)}</span>
            <span>•</span>
            <span>{t("documents.viewer.uploaded")}: {formatDate(doc.created_at)}</span>
            {publicMode && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <Globe className="h-3.5 w-3.5" />
                  {t("documents.viewer.publicShared", "Public Shared")}
                </span>
              </>
            )}
            {doc.description && (
              <>
                <span>•</span>
                <span className="italic truncate max-w-[300px]" title={doc.description}>{doc.description}</span>
              </>
            )}
          </div>
        </div>

        {/* PDF Frame Container */}
        <div className="flex-1 min-h-0 w-full mt-4 bg-surface-muted/50 rounded-lg border border-hairline overflow-hidden flex flex-col relative">
          {publicUrl ? (
            <iframe
              src={`${publicUrl}#view=FitH`}
              title={doc.name}
              className="w-full h-full border-none"
              onLoad={() => setIframeLoaded(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 flex-1">
              <p className="text-sm text-ink-muted">Unable to display PDF preview. No storage path found.</p>
            </div>
          )}
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
