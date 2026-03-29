import { NextResponse } from "next/server";

import { saveDebate, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const debate = await saveDebate(body);
    return NextResponse.json(debate);
  } catch (error) {
    console.error("Failed to save debate", error);
    const message = error instanceof Error ? error.message : "Unable to save debate.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
