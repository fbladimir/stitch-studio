// All database query functions
import { createClient } from "./client";
import type { Pattern, PatternThread, WipJournalEntry } from "@/types";

// ── Patterns ─────────────────────────────────────────────────

export async function getPatterns(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return { data: data as Pattern[] | null, error };
}

export async function getPattern(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("id", id)
    .single();
  return { data: data as Pattern | null, error };
}

export async function getPatternsForDuplicateCheck(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patterns")
    .select("id, name, designer, cover_photo_url")
    .eq("user_id", userId);
  return {
    data: data as Pick<Pattern, "id" | "name" | "designer" | "cover_photo_url">[] | null,
    error,
  };
}

export async function createPattern(
  userId: string,
  pattern: Omit<Pattern, "id" | "user_id" | "created_at" | "updated_at">
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patterns")
    .insert({ ...pattern, user_id: userId })
    .select()
    .single();
  return { data: data as Pattern | null, error };
}

export async function updatePattern(id: string, updates: Partial<Pattern>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patterns")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Pattern | null, error };
}

export async function deletePattern(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("patterns").delete().eq("id", id);
  return { error };
}

// ── Pattern Threads ──────────────────────────────────────────

export async function getPatternThreads(patternId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pattern_threads")
    .select("*")
    .eq("pattern_id", patternId)
    .order("sort_order", { ascending: true });
  return { data: data as PatternThread[] | null, error };
}

export async function addPatternThread(thread: Omit<PatternThread, "id">) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pattern_threads")
    .insert(thread)
    .select()
    .single();
  return { data: data as PatternThread | null, error };
}

export async function updatePatternThread(
  id: string,
  updates: Partial<Omit<PatternThread, "id" | "pattern_id">>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pattern_threads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as PatternThread | null, error };
}

export async function deletePatternThread(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("pattern_threads").delete().eq("id", id);
  return { error };
}

// ── WIP Journal ──────────────────────────────────────────────

export async function getWipJournal(patternId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wip_journal")
    .select("*")
    .eq("pattern_id", patternId)
    .order("created_at", { ascending: false });
  return { data: data as WipJournalEntry[] | null, error };
}

export async function addWipJournalEntry(
  entry: Omit<WipJournalEntry, "id" | "created_at">
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wip_journal")
    .insert(entry)
    .select()
    .single();
  return { data: data as WipJournalEntry | null, error };
}

// ── Storage ──────────────────────────────────────────────────

export async function uploadPatternCover(
  userId: string,
  patternId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${patternId}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pattern-covers")
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from("pattern-covers").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function uploadFoPhoto(
  userId: string,
  patternId: string,
  file: File,
  type: "fo" | "ffo"
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const bucket = type === "fo" ? "fo-photos" : "ffo-photos";
  const path = `${userId}/${patternId}/${type}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
