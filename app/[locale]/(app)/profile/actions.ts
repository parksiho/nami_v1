'use server'

import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { writeChangeLog } from '@/lib/changelog/write'
import {
  optionalFormValue,
  parseStudentProfileFields,
} from '@/lib/profile/form'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type ProfileActionState = {
  error?: string
  success?: string
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

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const t = await getTranslations('profile')

  if (!isSupabaseConfigured()) {
    return { error: t('errors.notConfigured') }
  }

  const name = optionalFormValue(formData, 'name')
  if (!name) return { error: t('errors.nameRequired') }

  const studentFields = parseStudentProfileFields(formData)
  if (!studentFields.ok) return { error: t('errors.invalidSemester') }

  const updates = {
    ...Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, optionalFormValue(formData, field)]),
    ),
    ...studentFields.data,
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: t('errors.unauthorized') }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { error: error.message || t('errors.saveFailed') }

  try {
    await writeChangeLog({
      actorId: user.id,
      action: 'PROFILE_UPDATE',
      targetType: 'PROFILE',
      targetId: user.id,
      summary: `Profile updated for ${user.email ?? user.id}`,
    })
  } catch (error) {
    console.error('Profile saved, but the change log could not be written.', error)
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/profile`, 'page')
  return { success: t('success.saved') }
}

export async function uploadAvatar(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const t = await getTranslations('profile')

  if (!isSupabaseConfigured()) {
    return { error: t('errors.notConfigured') }
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: t('errors.unauthorized') }

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const avatarPath = `${user.id}/avatar.${extension}`
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
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message || t('errors.avatarUploadFailed') }
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/profile`, 'page')
  return { success: t('success.avatarUploaded') }
}
