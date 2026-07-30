import type { User } from '@supabase/supabase-js'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import type { Profile } from '@/lib/domain/profile'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type AuthContext = {
  user: User
  profile: Profile
}

async function redirectToLogin(): Promise<never> {
  const locale = await getLocale()
  redirect({ href: '/login', locale })
  throw new Error('Redirected to login')
}

export async function requireUser(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'requireUser called without Supabase env. Guard callers with isSupabaseConfigured().',
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    await redirectToLogin()
  }

  const authedUser = user ?? (await redirectToLogin())

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authedUser.id)
    .maybeSingle()

  if (!profile) {
    await redirectToLogin()
  }

  return { user: authedUser, profile: profile as Profile }
}
