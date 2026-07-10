import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/i18n";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";

import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ApplicationsListPage } from "@/pages/applications/ApplicationsListPage";
import { ApplicationDetailPage } from "@/pages/applications/ApplicationDetailPage";
import { KanbanPage } from "@/pages/applications/KanbanPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { ContactsPage } from "@/pages/ContactsPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { TasksPage } from "@/pages/TasksPage";
import { NotesPage } from "@/pages/NotesPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading workspace…
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function LoginGate() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <div className="text-center">
        <div className="text-h1 text-ink">404</div>
        <p className="mt-2 text-sm text-ink-muted">Page not found.</p>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/login" element={<LoginGate />} />
            <Route
              path="/*"
              element={
                <Protected>
                  <CommandPaletteProvider>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/applications" element={<ApplicationsListPage />} />
                      <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                      <Route path="/kanban" element={<KanbanPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/companies" element={<CompaniesPage />} />
                      <Route path="/contacts" element={<ContactsPage />} />
                      <Route path="/documents" element={<DocumentsPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/notes" element={<NotesPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </CommandPaletteProvider>
                </Protected>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
