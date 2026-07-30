'use server'

import { revalidatePath } from 'next/cache'
import { forbidden } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/require-role'
import { writeChangeLog } from '@/lib/changelog/write'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { parseScoreUpdate } from '@/lib/teaching/grades'

export type ScoreActionState = {
  error?: string
  success?: string
}

export async function updateScore(
  enrollmentId: string,
  courseId: string,
  _previousState: ScoreActionState,
  formData: FormData,
): Promise<ScoreActionState> {
  const t = await getTranslations('teaching')
  if (!isSupabaseConfigured()) return { error: t('errors.notConfigured') }

  const parsed = parseScoreUpdate(formData)
  if ('error' in parsed) return { error: t(`errors.${parsed.error}`) }

  const { user } = await requireRole([UserRole.PROFESSOR])
  const supabase = await createClient()
  const ownership = await supabase
    .from('student_courses')
    .select('id, course:courses!inner(professor_id)')
    .eq('id', enrollmentId)
    .eq('course_id', courseId)
    .eq('course.professor_id', user.id)
    .maybeSingle()

  if (ownership.error) return { error: ownership.error.message }
  if (!ownership.data) forbidden()

  const { error } = await supabase
    .from('student_courses')
    .update({
      score: parsed.data.score,
      pass: parsed.data.pass,
      enrollment_status: parsed.data.enrollmentStatus,
    })
    .eq('id', enrollmentId)
    .eq('course_id', courseId)

  if (error) return { error: error.message || t('errors.saveFailed') }

  try {
    await writeChangeLog({
      actorId: user.id,
      action: 'STUDENT_COURSE_GRADE_UPDATE',
      targetType: 'STUDENT_COURSE',
      targetId: enrollmentId,
      summary: `Professor updated grade and status for enrollment ${enrollmentId}`,
    })
  } catch (logError) {
    console.error('Grade saved, but change log write failed.', logError)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/teaching/${courseId}`)
  return { success: t('success.saved') }
}
