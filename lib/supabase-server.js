import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function saveDebate({ title, intensity, messages }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("A debate needs at least one message.");
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    title: title || "Untitled debate",
    intensity: intensity || "intense",
    messages,
  };

  const { data, error } = await supabase
    .from("debates")
    .insert(payload)
    .select("id, title, intensity, messages, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDebateById(id) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("debates")
    .select("id, title, intensity, messages, created_at")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}
