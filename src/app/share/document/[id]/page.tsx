"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/services";
import { PDFViewerPage } from "@/features/PDFViewerPage";
import { SpreadsheetViewerPage } from "@/features/SpreadsheetViewerPage";
import { FileViewerPage } from "@/features/FileViewerPage";
import { Loader2 } from "lucide-react";
import { use } from "react";
import { useTranslation } from "react-i18next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShareDocumentPage({ params }: PageProps) {
  const { id } = use(params);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
        <h2 className="text-base font-bold text-ink">{t("documents.viewer.notFound")}</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-sm">
          {t("documents.viewer.notFoundDesc")}
        </p>
      </div>
    );
  }

  const name = doc.name;
  const mime = doc.mime || "";

  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
  const isSpreadsheet =
    mime === "text/csv" ||
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    /\.(xlsx|xls|csv)$/i.test(name);

  if (isPdf) {
    return <PDFViewerPage id={id} publicMode={true} />;
  }

  if (isSpreadsheet) {
    return <SpreadsheetViewerPage id={id} publicMode={true} />;
  }

  return <FileViewerPage id={id} publicMode={true} />;
}
