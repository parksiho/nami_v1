import type { User } from '@supabase/supabase-js'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { demoProfileByRole } from '@/lib/demo/data'
import { getDemoRole } from '@/lib/demo/mode'
import type { Profile } from '@/lib/domain/profile'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type AuthContext = {
  user: User
  profile: Profile
}

export type RequireUserOptions = {
  /**
   * When true, validates the JWT with Supabase Auth (`getUser`).
   * Use for mutations and role-gated admin/professor/student actions.
   * Default false uses cookie session (`getSession`) for faster navigations.
   */
  verify?: boolean
}

async function redirectToLogin(): Promise<never> {
  const locale = await getLocale()
  redirect({ href: '/login', locale })
  throw new Error('Redirected to login')
}

export async function requireUser(
  options: RequireUserOptions = {},
): Promise<AuthContext> {
  const demoRole = await getDemoRole()
  if (demoRole) {
    const profile = demoProfileByRole(demoRole)
    return { user: { id: profile.id } as User, profile }
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      'requireUser called without Supabase env. Guard callers with isSupabaseConfigured().',
    )
  }

  const supabase = await createClient()
  const verify = options.verify === true

  let user: User | null = null

  if (verify) {
    const {
      data: { user: verified },
    } = await supabase.auth.getUser()
    user = verified
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user = session?.user ?? null
  }

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

  const activeProfile = profile as Profile
  if (activeProfile.is_active === false) {
    await supabase.auth.signOut()
    await redirectToLogin()
  }

  return { user: authedUser, profile: activeProfile }
}
