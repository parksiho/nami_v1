'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { purgeProfileDependencies } from '@/lib/admin/delete-user'
import { getServiceRoleEnv, isUserRole } from '@/lib/admin/users'
import { writeChangeLog } from '@/lib/changelog/write'
import { canEnroll } from '@/lib/courses/enroll'
import { CourseEnrollmentStatus, UserRole } from '@/lib/domain/enums'
import {
  optionalFormValue,
  parseStudentProfileFields,
} from '@/lib/profile/form'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type AdminUserActionState = {
  error?: string
  success?: string
}

function createServiceClient() {
  const serviceEnv = getServiceRoleEnv()
  if (!serviceEnv) return null
  return createAdminClient(serviceEnv.url, serviceEnv.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const PROFILE_FIELDS = [
  'name',
  'birth_date',
  'occupation',
  'mobile',
  'nationality',
  'address',
  'gender',
  'church_name',
  'church_position',
  'preferred_language',
] as const

export async function updateAdminUser(
  userId: string,
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const t = await getTranslations('adminUsers')
  const { user: actor } = await requireRole([UserRole.ADMIN])
  const name = optionalFormValue(formData, 'name')
  const role = String(formData.get('role') ?? '')

  if (!name) return { error: t('errors.nameRequired') }
  if (!isUserRole(role)) return { error: t('errors.invalidRole') }

  const studentFields = parseStudentProfileFields(formData)
  if (!studentFields.ok) return { error: t('errors.invalidSemester') }

  const updates = {
    ...Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, optionalFormValue(formData, field)]),
    ),
    ...studentFields.data,
    role,
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) return { error: error.message || t('errors.saveFailed') }

  try {
    await writeChangeLog({
      actorId: actor.id,
      action: 'ADMIN_PROFILE_UPDATE',
      targetType: 'PROFILE',
      targetId: userId,
      summary: `Admin updated profile ${userId} (${role})`,
    })
  } catch (error) {
    console.error('Admin user saved, but change log write failed.', error)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users`)
  revalidatePath(`/${locale}/admin/users/${userId}`)
  return { success: t('success.saved') }
}

export async function createAdminUser(
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const t = await getTranslations('adminUsers')
  const { user: actor } = await requireRole([UserRole.ADMIN])
  const admin = createServiceClient()

  if (!admin) return { error: t('createUnavailable') }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = optionalFormValue(formData, 'name')
  const role = String(formData.get('role') ?? '')

  if (!email || !password || !name) return { error: t('errors.required') }
  if (!isUserRole(role)) return { error: t('errors.invalidRole') }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error || !data.user) {
    return { error: error?.message || t('errors.createFailed') }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ name, role, email, is_active: true })
    .eq('id', data.user.id)

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { error: profileError.message || t('errors.createFailed') }
  }

  try {
    await writeChangeLog({
      actorId: actor.id,
      action: 'ADMIN_USER_CREATE',
      targetType: 'PROFILE',
      targetId: data.user.id,
      summary: `Admin created ${email} (${role})`,
    })
  } catch (error) {
    console.error('Admin user created, but change log write failed.', error)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users`)
  return { success: t('success.created') }
}

export async function uploadAdminAvatar(
  userId: string,
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const t = await getTranslations('adminUsers')
  const { user: actor } = await requireRole([UserRole.ADMIN])

  if (!isSupabaseConfigured()) return { error: t('notConfigured') }

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) {
    return { error: t('errors.avatarRequired') }
  }
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return { error: t('errors.avatarType') }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: t('errors.avatarSize') }
  }

  const supabase = await createClient()
  const { data: profile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profileLookupError) return { error: profileLookupError.message }
  if (!profile) return { error: t('errors.notFound') }
  if (profile.role !== UserRole.STUDENT && profile.role !== UserRole.PROFESSOR) {
    return { error: t('errors.avatarRole') }
  }

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const avatarPath = `${userId}/avatar.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(avatarPath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { error: uploadError.message || t('errors.avatarUploadFailed') }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_path: avatarPath })
    .eq('id', userId)

  if (profileError) {
    return { error: profileError.message || t('errors.avatarUploadFailed') }
  }

  try {
    await writeChangeLog({
      actorId: actor.id,
      action: 'ADMIN_AVATAR_UPLOAD',
      targetType: 'PROFILE',
      targetId: userId,
      summary: `Admin uploaded avatar for ${userId}`,
    })
  } catch (error) {
    console.error('Admin avatar uploaded, but change log write failed.', error)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users`)
  revalidatePath(`/${locale}/admin/users/${userId}`)
  revalidatePath(`/${locale}/profile`)
  return { success: t('success.avatarUploaded') }
}

export async function setAdminUserActive(
  userId: string,
  isActive: boolean,
  previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  void previousState
  void formData
  const t = await getTranslations('adminUsers')
  const { user: actor } = await requireRole([UserRole.ADMIN])

  if (userId === actor.id) return { error: t('errors.cannotChangeSelf') }

  const supabase = await createClient()
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (lookupError) return { error: lookupError.message }
  if (!profile) return { error: t('errors.notFound') }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: error.message || t('errors.saveFailed') }

  try {
    await writeChangeLog({
      actorId: actor.id,
      action: isActive ? 'ADMIN_USER_ACTIVATE' : 'ADMIN_USER_DEACTIVATE',
      targetType: 'PROFILE',
      targetId: userId,
      summary: `Admin set user ${userId} active=${isActive}`,
    })
  } catch (logError) {
    console.error('User active flag updated, but change log write failed.', logError)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users`)
  revalidatePath(`/${locale}/admin/users/${userId}`)
  return {
    success: isActive ? t('success.activated') : t('success.deactivated'),
  }
}

export async function deleteAdminUser(
  userId: string,
  previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  void previousState
  void formData
  const t = await getTranslations('adminUsers')
  const { user: actor } = await requireRole([UserRole.ADMIN])
  const admin = createServiceClient()

  if (!admin) return { error: t('createUnavailable') }
  if (userId === actor.id) return { error: t('errors.cannotDeleteSelf') }

  const { data: profile, error: lookupError } = await admin
    .from('profiles')
    .select('id, email, role, avatar_path')
    .eq('id', userId)
    .maybeSingle()

  if (lookupError) return { error: lookupError.message }
  if (!profile) return { error: t('errors.notFound') }

  // Write audit row before cascading deletes remove related rows / auth user.
  try {
    await writeChangeLog({
      actorId: actor.id,
      action: 'ADMIN_USER_DELETE',
      targetType: 'PROFILE',
      targetId: userId,
      summary: `Admin deleting user ${profile.email ?? userId} (${profile.role})`,
    })
  } catch (logError) {
    console.error('Could not write pre-delete change log.', logError)
  }

  const purge = await purgeProfileDependencies(admin, userId)
  if (purge.error) {
    return { error: purge.error || t('errors.deleteFailed') }
  }

  if (profile.avatar_path) {
    await admin.storage.from('avatars').remove([profile.avatar_path])
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    const message = error.message || t('errors.deleteFailed')
    if (/foreign key|violates foreign key/i.test(message)) {
      return { error: t('errors.deleteBlockedByRelations') }
    }
    return { error: message }
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users`)
  redirect({ href: '/admin/users', locale })
  return { success: t('success.deleted') }
}

export async function proxyEnrollStudent(
  studentId: string,
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const t = await getTranslations('courseEnrollment')
  if (!isSupabaseConfigured()) return { error: t('errors.notConfigured') }

  const courseId = String(formData.get('courseId') ?? '').trim()
  if (!courseId) return { error: t('errors.courseRequired') }

  const { user: actor } = await requireRole([UserRole.ADMIN])
  const supabase = await createClient()
  const [studentResult, existingResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .eq('id', studentId)
      .eq('role', UserRole.STUDENT)
      .maybeSingle(),
    supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', studentId),
  ])

  const lookupError = studentResult.error ?? existingResult.error
  if (lookupError) return { error: lookupError.message }
  if (!studentResult.data) return { error: t('errors.invalidStudent') }
  if (!canEnroll((existingResult.data ?? []).map((item) => item.course_id), courseId)) {
    return { error: t('errors.alreadyEnrolled') }
  }

  const { error } = await supabase.from('student_courses').insert({
    student_id: studentId,
    course_id: courseId,
    enrollment_status: CourseEnrollmentStatus.APPLIED,
    score: 0,
    pass: false,
  })
  if (error) return { error: error.message || t('errors.enrollFailed') }

  try {
    await writeChangeLog({
      actorId: actor.id,
      action: 'ADMIN_STUDENT_COURSE_ENROLL',
      targetType: 'STUDENT_COURSE',
      targetId: studentId,
      summary: `Admin enrolled student ${studentId} in course ${courseId}`,
    })
  } catch (logError) {
    console.error('Student enrolled, but change log write failed.', logError)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/admin/users/${studentId}`)
  revalidatePath(`/${locale}/grades`)
  return { success: t('success.enrolled') }
}
