"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getDocument } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { fileSize, formatDate } from "@/lib/format";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function PDFViewerPage({ id, publicMode = false }: { id: string; publicMode?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
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

  return (
    <AppShell publicMode={publicMode}>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex justify-between items-start gap-4 pb-4 border-b border-hairline shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-ink mt-1.5 flex items-start gap-2 break-words">
              <FileText className="h-5 w-5 text-ink-muted shrink-0 mt-1" />
              <span className="break-all">{doc.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mt-1">
              <span>{t("documents.viewer.size")}: {fileSize(doc.size)}</span>
              <span>•</span>
              <span>{t("documents.viewer.uploaded")}: {formatDate(doc.created_at)}</span>
              {doc.description && (
                <>
                  <span>•</span>
                  <span className="italic truncate max-w-[300px]" title={doc.description}>{doc.description}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
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
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 md:w-auto md:px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
                title={t("documents.viewer.download")}
              >
                <Download className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{t("documents.viewer.download")}</span>
              </button>
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
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 flex-1">
              <p className="text-sm text-ink-muted">Unable to display PDF preview. No storage path found.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
