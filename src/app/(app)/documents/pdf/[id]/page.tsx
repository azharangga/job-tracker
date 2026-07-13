import { PDFViewerPage } from "@/features/PDFViewerPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PDFViewerPage id={id} />;
}
