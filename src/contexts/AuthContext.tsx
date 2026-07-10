import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { callAuth, clearSession, loadSession, saveSession } from "@/lib/session";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import demoSeedData from "@/demoData.json";
import i18n from "@/i18n";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  loginAsDemo: () => void;
  resetDemoData: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: { name?: string; avatar_url?: string | null }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: User = {
  id: "demo-user-id",
  email: "demo@example.com",
  name: "Demo User",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const initDemoData = useCallback((force = false) => {
    const checkKey = "demo_applications";
    if (force || !localStorage.getItem(checkKey)) {
      Object.entries(demoSeedData).forEach(([key, val]) => {
        localStorage.setItem(`demo_${key}`, JSON.stringify(val));
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    if (typeof window !== "undefined") {
      const demoUserStored = localStorage.getItem("demo_user_session");
      if (demoUserStored) {
        setUser(JSON.parse(demoUserStored));
        setToken("demo-token");
        setIsDemoMode(true);
        setLoading(false);
        return;
      }
    }

    const stored = loadSession();
    if (!stored) {
      setUser(null);
      setToken(null);
      setIsDemoMode(false);
      setLoading(false);
      return;
    }
    try {
      const { user: fresh } = await callAuth<{ user: User }>("me", {
        token: stored.token,
      });
      setUser(fresh);
      setToken(stored.token);
      setIsDemoMode(false);
      saveSession({ token: stored.token, user: fresh });
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      // Clear demo session if any
      localStorage.removeItem("demo_user_session");
      setIsDemoMode(false);

      const { token: t, user: u } = await callAuth<{ token: string; user: User }>(
        "login",
        { email, password, remember },
      );
      saveSession({ token: t, user: u });
      sessionStorage.setItem("show_login_success", "true");
      setUser(u);
      setToken(t);
      const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/applications";
      sessionStorage.removeItem("redirectAfterLogin");
      router.replace(redirectTo);
    },
    [router],
  );

  const loginAsDemo = useCallback(() => {
    // Clear live session
    clearSession();

    // Initialize demo data
    initDemoData();

    // Save demo session
    localStorage.setItem("demo_user_session", JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    setToken("demo-token");
    setIsDemoMode(true);

    const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/applications";
    sessionStorage.removeItem("redirectAfterLogin");
    router.replace(redirectTo);
    toast.success(i18n.t("demo.welcome"));
  }, [initDemoData, router]);

  const resetDemoData = useCallback(() => {
    initDemoData(true);
    toast.success(i18n.t("demo.resetSuccess"));
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [initDemoData]);

  const logout = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem("demo_user_session");
      setUser(null);
      setToken(null);
      setIsDemoMode(false);
      return;
    }

    if (token) {
      try {
        await callAuth("logout", { token });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setUser(null);
    setToken(null);
  }, [isDemoMode, token]);

  const updateProfile = useCallback(
    async (patch: { name?: string; avatar_url?: string | null }) => {
      if (isDemoMode && user) {
        const updated = { ...user, ...patch };
        setUser(updated);
        localStorage.setItem("demo_user_session", JSON.stringify(updated));
        toast.success(i18n.t("demo.profileUpdated"));
        return;
      }

      if (!token) return;
      const { user: u } = await callAuth<{ user: User }>("update-profile", {
        token,
        ...patch,
      });
      setUser(u);
      saveSession({ token, user: u });
    },
    [isDemoMode, token, user],
  );

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (isDemoMode) {
        toast.error(i18n.t("settings.passwordChangeDisabledInDemo"));
        return;
      }

      if (!token) return;
      await callAuth("change-password", { token, current, next });
    },
    [isDemoMode, token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isDemoMode,
      login,
      loginAsDemo,
      resetDemoData,
      logout,
      refresh,
      updateProfile,
      changePassword,
    }),
    [
      user,
      token,
      loading,
      isDemoMode,
      login,
      loginAsDemo,
      resetDemoData,
      logout,
      refresh,
      updateProfile,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
