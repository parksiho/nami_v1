'use server'

import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type AuthActionState = {
  error?: string
  success?: string
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getTranslations('auth')

  if (!isSupabaseConfigured()) {
    return { error: t('errors.notConfigured') }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: t('errors.required') }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: t('errors.invalidCredentials') }
  }

  const locale = await getLocale()
  redirect({ href: '/home', locale })
  return {}
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getTranslations('auth')

  if (!isSupabaseConfigured()) {
    return { error: t('errors.notConfigured') }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!name || !email || !password || !confirmPassword) {
    return { error: t('errors.required') }
  }

  if (password !== confirmPassword) {
    return { error: t('errors.passwordMismatch') }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) {
    return { error: error.message || t('errors.generic') }
  }

  const locale = await getLocale()

  if (data.session) {
    redirect({ href: '/home', locale })
    return {}
  }

  return { success: t('success.registered') }
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getTranslations('auth')

  if (!isSupabaseConfigured()) {
    return { error: t('errors.notConfigured') }
  }

  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!password || !confirmPassword) {
    return { error: t('errors.required') }
  }

  if (password !== confirmPassword) {
    return { error: t('errors.passwordMismatch') }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = await getLocale()
    redirect({ href: '/login', locale })
    return {}
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message || t('errors.generic') }
  }

  return { success: t('success.passwordUpdated') }
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  const locale = await getLocale()
  redirect({ href: '/login', locale })
}
