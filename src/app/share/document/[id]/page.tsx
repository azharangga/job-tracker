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
      title: `${doc.name} - Shared Document`,
      description: `View and download shared document: ${doc.name}`,
      openGraph: {
        title: doc.name,
        description: `Public shared document: ${doc.name}`,
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
