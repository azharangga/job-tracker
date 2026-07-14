import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Helper to generate a 6-character short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, customAlias } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Validate custom alias if provided
    let code = customAlias ? customAlias.trim() : "";
    if (code) {
      // Check if alias contains invalid chars or is too long/short
      if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
        return NextResponse.json({ error: "Custom alias can only contain letters, numbers, hyphens, and underscores." }, { status: 400 });
      }
    } else {
      code = generateShortCode();
    }

    const { error } = await supabase
      .from("shortlinks" as any)
      .insert({ short_code: code, target_url: url });

    if (error) {
      console.error("Failed to insert shortlink:", error);
      // Supabase returns 23505 for unique violation
      if (error.code === '23505') {
        return NextResponse.json({ error: "This custom alias is already taken. Please choose another one." }, { status: 409 });
      }
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Return the absolute short URL
    // Get the base URL from the incoming request or origin
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const shortUrl = `${origin}/s/${code}`;

    return NextResponse.json({ shortUrl });
  } catch (err: any) {
    console.error("Error creating shortlink:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
