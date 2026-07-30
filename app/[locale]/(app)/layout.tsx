import type { ReactNode } from 'react'
import { UserRole } from '@/lib/domain/enums'
import { getNavItems } from '@/lib/home/build-home-model'
import { requireUser } from '@/lib/auth/require-user'
import { AppHeader } from '@/components/layout/AppHeader'
import { RoleNav } from '@/components/layout/RoleNav'
import { isSupabaseConfigured } from '@/lib/supabase/env'

type Props = {
  children: ReactNode
}

/**
 * Protected app shell. When Supabase env vars are set, unauthenticated users
 * are redirected to /[locale]/login. Without env, auth is skipped and a demo
 * STUDENT shell is shown for local development.
 */
export default async function AppLayout({ children }: Props) {
  const profile = isSupabaseConfigured()
    ? (await requireUser()).profile
    : { name: 'Demo Student', role: UserRole.STUDENT }

  const navItems = getNavItems(profile.role)

  return (
    <>
      <AppHeader profile={profile} />
      <RoleNav items={navItems} />
      {children}
    </>
  )
}
