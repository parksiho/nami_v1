'use server'

import { revalidatePath } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/require-role'
import { writeChangeLog } from '@/lib/changelog/write'
import { UserRole } from '@/lib/domain/enums'
import { parseNoticeFormData } from '@/lib/notices/form'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type NoticeActionState = { error?: string; success?: string }

async function context() {
  const t = await getTranslations('notices')
  if (!isSupabaseConfigured()) return { error: t('errors.notConfigured') } as const
  const { user } = await requireRole([UserRole.ADMIN])
  return { t, user, supabase: await createClient() } as const
}

async function log(
  actorId: string,
  action: string,
  targetId: string,
  summary: string,
) {
  try {
    await writeChangeLog({
      actorId,
      action,
      targetType: 'NOTICE',
      targetId,
      summary,
    })
  } catch (error) {
    console.error('Notice changed, but change log write failed.', error)
  }
}

async function revalidate(noticeId?: string) {
  const locale = await getLocale()
  revalidatePath(`/${locale}/notices`)
  revalidatePath(`/${locale}/home`)
  if (noticeId) revalidatePath(`/${locale}/notices/${noticeId}`)
}

export async function createNotice(
  _state: NoticeActionState,
  formData: FormData,
): Promise<NoticeActionState> {
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }
  const parsed = parseNoticeFormData(formData)
  if ('error' in parsed) return { error: ctx.t('errors.required') }

  const { data, error } = await ctx.supabase
    .from('notices')
    .insert({ ...parsed.data, author_id: ctx.user.id })
    .select('id')
    .single()
  if (error || !data) return { error: error?.message || ctx.t('errors.createFailed') }

  await log(ctx.user.id, 'NOTICE_CREATE', data.id, `Created notice: ${parsed.data.title}`)
  await revalidate(data.id)
  return { success: ctx.t('success.created') }
}

export async function updateNotice(
  noticeId: string,
  _state: NoticeActionState,
  formData: FormData,
): Promise<NoticeActionState> {
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }
  const parsed = parseNoticeFormData(formData)
  if ('error' in parsed) return { error: ctx.t('errors.required') }

  const { data, error } = await ctx.supabase
    .from('notices')
    .update(parsed.data)
    .eq('id', noticeId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { error: error?.message || ctx.t('errors.saveFailed') }

  await log(ctx.user.id, 'NOTICE_UPDATE', noticeId, `Updated notice: ${parsed.data.title}`)
  await revalidate(noticeId)
  return { success: ctx.t('success.saved') }
}

export async function deleteNotice(
  noticeId: string,
  _state: NoticeActionState,
  _formData: FormData,
): Promise<NoticeActionState> {
  void _state
  void _formData
  const ctx = await context()
  if ('error' in ctx) return { error: ctx.error }

  const { data, error } = await ctx.supabase
    .from('notices')
    .delete()
    .eq('id', noticeId)
    .select('id, title')
    .maybeSingle()
  if (error || !data) return { error: error?.message || ctx.t('errors.deleteFailed') }

  await log(ctx.user.id, 'NOTICE_DELETE', noticeId, `Deleted notice: ${data.title}`)
  await revalidate()
  return { success: ctx.t('success.deleted') }
}
