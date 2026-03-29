import { NextResponse } from "next/server";

import { generateScore } from "@/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const score = await generateScore(body);
    return NextResponse.json(score);
  } catch (error) {
    console.error("Failed to score argument", error);
    const message =
      error instanceof Error ? error.message : "Unable to score the argument.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
