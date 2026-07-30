import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth/require-role'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminCoursesLayout({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    await requireRole([UserRole.ADMIN])
  }

  return children
}
