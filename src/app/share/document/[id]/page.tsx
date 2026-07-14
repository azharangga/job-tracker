import { Metadata } from "next";
import { getDocument } from "@/services/live";
import ShareDocumentClient from "./ShareDocumentClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const doc = await getDocument(id);
    if (!doc) {
      return {
        title: "Document Not Found - Job Tracker",
      };
    }
    return {
      title: doc.name,
      description: "Access and download this document via Job Tracker. This page provides a live preview and detailed information of the file shared with you.",
      openGraph: {
        title: doc.name,
        description: "Access and download this document via Job Tracker. This page provides a live preview and detailed information of the file shared with you.",
      },
    };
  } catch (e) {
    return {
      title: "Shared Document - Job Tracker",
    };
  }
}

export default async function ShareDocumentPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <ShareDocumentClient id={resolvedParams.id} />;
}
