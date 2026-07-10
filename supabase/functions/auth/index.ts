// @ts-nocheck
// Job Tracker — custom authentication edge function.
// Endpoints:
//   POST /auth/login    { email, password, remember }         -> { token, user }
//   POST /auth/logout   { token }                              -> { ok }
//   POST /auth/me       { token }                              -> { user }
//   POST /auth/update-profile { token, name, avatar_url }      -> { user }
//   POST /auth/change-password { token, current, next }        -> { ok }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sha256(input: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getUserFromToken(token: string) {
  const tokenHash = await sha256(token);
  const { data: session } = await supabase
    .from("sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, avatar_url, last_login_at, created_at")
    .eq("id", session.user_id)
    .maybeSingle();
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    const body = await req.json().catch(() => ({}));

    if (action === "login") {
      const { email, password, remember } = body;
      if (!email || !password)
        return json({ error: "Email and password required" }, 400);

      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, password_hash, avatar_url, created_at")
        .eq("email", String(email).toLowerCase().trim())
        .maybeSingle();

      if (!user) return json({ error: "Invalid credentials" }, 401);
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return json({ error: "Invalid credentials" }, 401);

      const token = randomToken();
      const tokenHash = await sha256(token);
      const expires = new Date();
      expires.setDate(expires.getDate() + (remember ? 30 : 3));

      await supabase.from("sessions").insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expires.toISOString(),
        remember_me: !!remember,
        user_agent: req.headers.get("user-agent") ?? null,
      });

      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);

      const { password_hash: _, ...safe } = user;
      return json({ token, user: safe });
    }

    if (action === "me") {
      const user = await getUserFromToken(body.token ?? "");
      if (!user) return json({ error: "Invalid session" }, 401);
      return json({ user });
    }

    if (action === "logout") {
      const tokenHash = await sha256(body.token ?? "");
      await supabase.from("sessions").delete().eq("token_hash", tokenHash);
      return json({ ok: true });
    }

    if (action === "update-profile") {
      const user = await getUserFromToken(body.token ?? "");
      if (!user) return json({ error: "Invalid session" }, 401);
      const patch: Record<string, unknown> = {};
      if (typeof body.name === "string") patch.name = body.name.trim();
      if (typeof body.avatar_url === "string")
        patch.avatar_url = body.avatar_url;
      const { data } = await supabase
        .from("users")
        .update(patch)
        .eq("id", user.id)
        .select("id, name, email, avatar_url, created_at")
        .single();
      return json({ user: data });
    }

    if (action === "change-password") {
      const user = await getUserFromToken(body.token ?? "");
      if (!user) return json({ error: "Invalid session" }, 401);
      const { data: full } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", user.id)
        .single();
      const ok = await bcrypt.compare(body.current ?? "", full!.password_hash);
      if (!ok) return json({ error: "Current password is incorrect" }, 200);
      if (!body.next || String(body.next).length < 8)
        return json({ error: "New password must be at least 8 characters" }, 200);
      const hash = await bcrypt.hash(body.next, 10);
      await supabase.from("users").update({ password_hash: hash }).eq("id", user.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
