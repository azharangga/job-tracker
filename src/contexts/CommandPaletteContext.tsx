import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Calendar,
  Building2,
  Users,
  FileText,
  CheckSquare,
  StickyNote,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Plus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

interface Ctx {
  open: () => void;
  close: () => void;
}

const CommandPaletteCtx = createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      // Slight defer so the dialog closes before navigation.
      requestAnimationFrame(fn);
    },
    [setOpen],
  );

  const go = (path: string) => run(() => router.push(path));

  return (
    <CommandPaletteCtx.Provider
      value={{ open: () => setOpen(true), close: () => setOpen(false) }}
    >
      {children}
      <CommandDialog open={isOpen} onOpenChange={setOpen}>
        <CommandInput placeholder="Search commands…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go("/")}>
              <LayoutDashboard /> Dashboard
            </CommandItem>
            <CommandItem onSelect={() => go("/applications")}>
              <Briefcase /> Applications
            </CommandItem>
            <CommandItem onSelect={() => go("/kanban")}>
              <Kanban /> Kanban Board
            </CommandItem>
            <CommandItem onSelect={() => go("/calendar")}>
              <Calendar /> Calendar
            </CommandItem>
            <CommandItem onSelect={() => go("/companies")}>
              <Building2 /> Companies
            </CommandItem>
            <CommandItem onSelect={() => go("/contacts")}>
              <Users /> Contacts
            </CommandItem>
            <CommandItem onSelect={() => go("/documents")}>
              <FileText /> Documents
            </CommandItem>
            <CommandItem onSelect={() => go("/tasks")}>
              <CheckSquare /> Tasks
            </CommandItem>
            <CommandItem onSelect={() => go("/notes")}>
              <StickyNote /> Notes
            </CommandItem>
            <CommandItem onSelect={() => go("/analytics")}>
              <BarChart3 /> Analytics
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings /> Settings
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go("/applications?new=1")}>
              <Plus /> New application
            </CommandItem>
            <CommandItem onSelect={() => run(toggle)}>
              {theme === "dark" ? <Sun /> : <Moon />}
              Toggle theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => void logout())}>
              <LogOut /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandPaletteCtx.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteCtx);
  if (!ctx) throw new Error("useCommandPalette must be inside provider");
  return ctx;
}
