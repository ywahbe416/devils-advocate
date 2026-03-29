import { NextResponse } from "next/server";

import { generateDebateReply } from "@/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const reply = await generateDebateReply(body);
    return NextResponse.json(reply);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate a debate reply.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
