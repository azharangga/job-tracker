import { ProtectedLayout } from "@/providers/ProtectedLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
