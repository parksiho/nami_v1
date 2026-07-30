'use server'

import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/require-role'
import { writeChangeLog } from '@/lib/changelog/write'
import { canEnroll } from '@/lib/courses/enroll'
import { CourseEnrollmentStatus, UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type EnrollmentActionState = {
  error?: string
  success?: string
}

export async function enrollInCourse(
  _previousState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const t = await getTranslations('courseEnrollment')
  if (!isSupabaseConfigured()) return { error: t('errors.notConfigured') }

  const courseId = String(formData.get('courseId') ?? '').trim()
  if (!courseId) return { error: t('errors.courseRequired') }

  const { user } = await requireRole([UserRole.STUDENT])
  const supabase = await createClient()
  const { data: existing, error: existingError } = await supabase
    .from('student_courses')
    .select('course_id')
    .eq('student_id', user.id)

  if (existingError) return { error: existingError.message }
  if (!canEnroll((existing ?? []).map((item) => item.course_id), courseId)) {
    return { error: t('errors.alreadyEnrolled') }
  }

  const { error } = await supabase.from('student_courses').insert({
    student_id: user.id,
    course_id: courseId,
    enrollment_status: CourseEnrollmentStatus.APPLIED,
    score: 0,
    pass: false,
  })

  if (error) return { error: error.message || t('errors.enrollFailed') }

  try {
    await writeChangeLog({
      actorId: user.id,
      action: 'STUDENT_COURSE_ENROLL',
      targetType: 'STUDENT_COURSE',
      targetId: user.id,
      summary: `Student ${user.id} enrolled in course ${courseId}`,
    })
  } catch (logError) {
    console.error('Course enrollment saved, but change log write failed.', logError)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/enroll`)
  revalidatePath(`/${locale}/grades`)
  return { success: t('success.enrolled') }
}
