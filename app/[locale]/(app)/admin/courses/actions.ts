'use server'

import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/require-role'
import { writeChangeLog } from '@/lib/changelog/write'
import { parseCourseFormData } from '@/lib/admin/courses'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type CourseActionState = {
  error?: string
  success?: string
}

async function getActionContext() {
  const t = await getTranslations('adminCourses')
  if (!isSupabaseConfigured()) {
    return { t, error: t('errors.notConfigured') } as const
  }
  const { user } = await requireRole([UserRole.ADMIN])
  const supabase = await createClient()
  return { t, user, supabase } as const
}

async function isProfessor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professorId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', professorId)
    .eq('role', UserRole.PROFESSOR)
    .maybeSingle()
  return !error && Boolean(data)
}

async function logCourseChange(input: {
  actorId: string
  action: string
  targetId: string
  summary: string
}) {
  try {
    await writeChangeLog({
      actorId: input.actorId,
      action: input.action,
      targetType: 'COURSE',
      targetId: input.targetId,
      summary: input.summary,
    })
  } catch (error) {
    console.error('Course changed, but change log write failed.', error)
  }
}

export async function createCourse(
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  const parsed = parseCourseFormData(formData)
  if ('error' in parsed) return { error: context.t(`errors.${parsed.error}`) }
  if (!(await isProfessor(context.supabase, parsed.data.professorId))) {
    return { error: context.t('errors.invalidProfessor') }
  }

  const { data, error } = await context.supabase
    .from('courses')
    .insert({
      name: parsed.data.name,
      professor_id: parsed.data.professorId,
      year: parsed.data.year,
      semester: parsed.data.semester,
      credit: parsed.data.credit,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message || context.t('errors.createFailed') }

  await logCourseChange({
    actorId: context.user.id,
    action: 'ADMIN_COURSE_CREATE',
    targetId: data.id,
    summary: `Admin created course ${parsed.data.name}`,
  })
  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/courses`)
  return { success: context.t('success.created') }
}

export async function updateCourse(
  courseId: string,
  _previousState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  const parsed = parseCourseFormData(formData)
  if ('error' in parsed) return { error: context.t(`errors.${parsed.error}`) }
  if (!(await isProfessor(context.supabase, parsed.data.professorId))) {
    return { error: context.t('errors.invalidProfessor') }
  }

  const { data, error } = await context.supabase
    .from('courses')
    .update({
      name: parsed.data.name,
      professor_id: parsed.data.professorId,
      year: parsed.data.year,
      semester: parsed.data.semester,
      credit: parsed.data.credit,
    })
    .eq('id', courseId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { error: error?.message || context.t('errors.saveFailed') }

  await logCourseChange({
    actorId: context.user.id,
    action: 'ADMIN_COURSE_UPDATE',
    targetId: courseId,
    summary: `Admin updated course ${parsed.data.name}`,
  })
  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/courses`)
  revalidatePath(`/${locale}/admin/courses/${courseId}`)
  return { success: context.t('success.saved') }
}

export async function deleteCourse(
  courseId: string,
  _previousState: CourseActionState,
  _formData: FormData,
): Promise<CourseActionState> {
  void _previousState
  void _formData
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  const { data, error } = await context.supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .select('id, name')
    .maybeSingle()

  if (error || !data) return { error: error?.message || context.t('errors.deleteFailed') }

  await logCourseChange({
    actorId: context.user.id,
    action: 'ADMIN_COURSE_DELETE',
    targetId: courseId,
    summary: `Admin deleted course ${data.name}`,
  })
  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/courses`)
  return { success: context.t('success.deleted') }
}
