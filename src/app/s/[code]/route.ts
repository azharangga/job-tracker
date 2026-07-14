import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("shortlinks" as any)
      .select("target_url, is_active")
      .eq("short_code", code)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.redirect(new URL("/404", request.url));
    }

    const row = data as unknown as { target_url: string; is_active: boolean };
    
    if (!row.is_active) {
      return NextResponse.redirect(new URL("/404", request.url));
    }

    return NextResponse.redirect(row.target_url, { status: 302 });
  } catch (err: any) {
    console.error("Error resolving shortlink:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
