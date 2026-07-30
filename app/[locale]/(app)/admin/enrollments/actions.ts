'use server'

import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/require-role'
import { writeChangeLog } from '@/lib/changelog/write'
import { UserRole } from '@/lib/domain/enums'
import { appendHistory, type EnrollmentHistorySource } from '@/lib/enrollment/append-history'
import { parseEnrollmentFormData, type EnrollmentFormValues } from '@/lib/enrollment/form'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type EnrollmentActionState = { error?: string; success?: string }

async function context() {
  const t = await getTranslations('enrollment')
  if (!isSupabaseConfigured()) return { error: t('errors.notConfigured') } as const
  const { user } = await requireRole([UserRole.ADMIN])
  return { t, user, supabase: await createClient() } as const
}

const toRow = (data: EnrollmentFormValues) => ({
  student_id: data.studentId,
  grade_year: data.gradeYear,
  year: data.year,
  semester: data.semester,
  status: data.status,
  entrance_info: data.entranceInfo,
  graduate_info: data.graduateInfo,
  change_reason: data.changeReason,
  leave_start: data.leaveStart,
  leave_end: data.leaveEnd,
  advisor_professor_id: data.advisorProfessorId,
})

async function log(actorId: string, action: string, targetId: string, summary: string) {
  try {
    await writeChangeLog({ actorId, action, targetType: 'ENROLLMENT_RECORD', targetId, summary })
  } catch (error) {
    console.error('Enrollment changed, but change log write failed.', error)
  }
}

async function revalidate(recordId?: string) {
  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/enrollments`)
  revalidatePath(`/${locale}/enrollment`)
  if (recordId) revalidatePath(`/${locale}/admin/enrollments/${recordId}`)
}

export async function createEnrollment(
  _state: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }
  const parsed = parseEnrollmentFormData(formData)
  if ('error' in parsed) return { error: ctx.t(`errors.${parsed.error}`) }

  const { data, error } = await ctx.supabase.from('enrollment_records')
    .insert(toRow(parsed.data)).select('*').single()
  if (error || !data) return { error: error?.message || ctx.t('errors.createFailed') }

  const history = {
    enrollment_record_id: data.id,
    student_id: data.student_id,
    from_status: null,
    to_status: data.status,
    reason: data.change_reason,
    leave_start: data.leave_start,
    leave_end: data.leave_end,
    advisor_id: data.advisor_professor_id,
    changed_by: ctx.user.id,
  }
  const historyResult = await ctx.supabase.from('enrollment_history').insert(history)
  if (historyResult.error) {
    await ctx.supabase.from('enrollment_records').delete().eq('id', data.id)
    return { error: historyResult.error.message }
  }
  await log(ctx.user.id, 'ADMIN_ENROLLMENT_CREATE', data.id, `Created enrollment for ${data.student_id}`)
  await revalidate(data.id)
  return { success: ctx.t('success.created') }
}

export async function updateEnrollment(
  recordId: string,
  _state: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }
  const parsed = parseEnrollmentFormData(formData)
  if ('error' in parsed) return { error: ctx.t(`errors.${parsed.error}`) }

  const oldResult = await ctx.supabase.from('enrollment_records').select('*').eq('id', recordId).maybeSingle()
  if (oldResult.error || !oldResult.data) return { error: oldResult.error?.message || ctx.t('errors.notFound') }
  const updateResult = await ctx.supabase.from('enrollment_records')
    .update(toRow(parsed.data)).eq('id', recordId).select('*').maybeSingle()
  if (updateResult.error || !updateResult.data) return { error: updateResult.error?.message || ctx.t('errors.saveFailed') }

  const history = appendHistory(
    oldResult.data as EnrollmentHistorySource,
    updateResult.data as EnrollmentHistorySource,
    ctx.user.id,
  )
  if (history) {
    const historyResult = await ctx.supabase.from('enrollment_history').insert(history)
    if (historyResult.error) {
      await ctx.supabase.from('enrollment_records').update({
        student_id: oldResult.data.student_id,
        grade_year: oldResult.data.grade_year,
        year: oldResult.data.year,
        semester: oldResult.data.semester,
        status: oldResult.data.status,
        entrance_info: oldResult.data.entrance_info,
        graduate_info: oldResult.data.graduate_info,
        change_reason: oldResult.data.change_reason,
        leave_start: oldResult.data.leave_start,
        leave_end: oldResult.data.leave_end,
        advisor_professor_id: oldResult.data.advisor_professor_id,
      }).eq('id', recordId)
      return { error: historyResult.error.message }
    }
  }
  await log(ctx.user.id, 'ADMIN_ENROLLMENT_UPDATE', recordId, `Updated enrollment for ${parsed.data.studentId}`)
  await revalidate(recordId)
  return { success: ctx.t('success.saved') }
}

export async function deleteEnrollment(
  recordId: string,
  _state: EnrollmentActionState,
  _formData: FormData,
): Promise<EnrollmentActionState> {
  void _state
  void _formData
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }
  const result = await ctx.supabase.from('enrollment_records').delete().eq('id', recordId)
    .select('id, student_id').maybeSingle()
  if (result.error || !result.data) return { error: result.error?.message || ctx.t('errors.deleteFailed') }
  await log(ctx.user.id, 'ADMIN_ENROLLMENT_DELETE', recordId, `Deleted enrollment for ${result.data.student_id}`)
  await revalidate()
  return { success: ctx.t('success.deleted') }
}
