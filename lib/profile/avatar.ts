import type { SupabaseClient } from '@supabase/supabase-js'

export function getAvatarPublicUrl(
  supabase: SupabaseClient,
  avatarPath: string | null | undefined,
): string | null {
  if (!avatarPath) return null
  return supabase.storage.from('avatars').getPublicUrl(avatarPath).data.publicUrl
}

export function profileInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
