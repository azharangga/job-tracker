"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/services";
import { PDFViewerPage } from "@/features/PDFViewerPage";
import { SpreadsheetViewerPage } from "@/features/SpreadsheetViewerPage";
import { FileViewerPage } from "@/features/FileViewerPage";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

interface ShareDocumentClientProps {
  id: string;
}

export default function ShareDocumentClient({ id }: ShareDocumentClientProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  useEffect(() => {
    if (doc?.name) {
      document.title = `${doc.name} - Shared Document`;
    }
  }, [doc]);

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
    const vParam = searchParams ? searchParams.get("v") : null;
    let allowedSheets: number[] | undefined = undefined;
    if (vParam) {
      try {
        let base64 = vParam;
        while (base64.length % 4) {
          base64 += "=";
        }
        const decoded = atob(base64);
        allowedSheets = decoded
          .split(",")
          .filter((s) => s.trim() !== "")
          .map(Number)
          .filter((n) => !isNaN(n));
      } catch (err) {
        console.error("Failed to decode sheets token:", err);
      }
    }
    return <SpreadsheetViewerPage id={id} publicMode={true} allowedSheets={allowedSheets} />;
  }

  return <FileViewerPage id={id} publicMode={true} />;
}
