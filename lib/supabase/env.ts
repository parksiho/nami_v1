export type SupabaseEnv = {
  url: string
  anonKey: string
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  // Prefer classic anon JWT; fall back to new publishable key (sb_publishable_...)
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}
