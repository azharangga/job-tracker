import { FileViewerPage } from "@/features/FileViewerPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <FileViewerPage id={id} />;
}
