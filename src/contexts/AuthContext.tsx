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

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: { name?: string; avatar_url?: string | null }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = loadSession();
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const { user: fresh } = await callAuth<{ user: User }>("me", {
        token: stored.token,
      });
      setUser(fresh);
      setToken(stored.token);
      saveSession({ token: stored.token, user: fresh });
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
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

  const logout = useCallback(async () => {
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
  }, [token]);

  const updateProfile = useCallback(
    async (patch: { name?: string; avatar_url?: string | null }) => {
      if (!token) return;
      const { user: u } = await callAuth<{ user: User }>("update-profile", {
        token,
        ...patch,
      });
      setUser(u);
      saveSession({ token, user: u });
    },
    [token],
  );

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!token) return;
      await callAuth("change-password", { token, current, next });
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout, refresh, updateProfile, changePassword }),
    [user, token, loading, login, logout, refresh, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
