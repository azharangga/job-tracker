import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/types";

const SESSION_KEY = "jobtracker.session";

interface StoredSession {
  token: string;
  user: User;
}

export function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Invoke the `auth` edge function with a subpath action. */
export async function callAuth<T = unknown>(
  action: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(`auth/${action}`, {
    body,
  });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as any).error);
  }
  return data as T;
}
