import { notFound } from "next/navigation";

import DebateTranscript from "@/components/debate-transcript";
import { getDebateById, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function SharedDebatePage({ params }) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const debate = await getDebateById(params.id);
  if (!debate) {
    notFound();
  }

  return <DebateTranscript debate={debate} />;
}
