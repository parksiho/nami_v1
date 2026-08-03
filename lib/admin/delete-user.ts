import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Remove or detach rows that historically blocked profile deletion
 * (FKs without ON DELETE CASCADE / SET NULL).
 */
export async function purgeProfileDependencies(
  admin: SupabaseClient,
  userId: string,
): Promise<{ error?: string }> {
  const steps: Array<() => PromiseLike<{ error: { message: string } | null }>> = [
    () => admin.from('change_logs').delete().eq('actor_id', userId),
    () => admin.from('notices').delete().eq('author_id', userId),
    () =>
      admin
        .from('enrollment_history')
        .update({ advisor_id: null })
        .eq('advisor_id', userId),
    () =>
      admin
        .from('enrollment_history')
        .update({ changed_by: null })
        .eq('changed_by', userId),
    () => admin.from('enrollment_history').delete().eq('student_id', userId),
    () =>
      admin
        .from('enrollment_records')
        .update({ advisor_professor_id: null })
        .eq('advisor_professor_id', userId),
    () => admin.from('enrollment_records').delete().eq('student_id', userId),
    () => admin.from('student_courses').delete().eq('student_id', userId),
    () => admin.from('courses').delete().eq('professor_id', userId),
  ]

  for (const step of steps) {
    const { error } = await step()
    if (error) return { error: error.message }
  }

  const { data: files, error: listError } = await admin.storage
    .from('avatars')
    .list(userId)
  if (listError) return { error: listError.message }

  if (files?.length) {
    const paths = files.map((file) => `${userId}/${file.name}`)
    const { error: removeError } = await admin.storage.from('avatars').remove(paths)
    if (removeError) return { error: removeError.message }
  }

  return {}
}
