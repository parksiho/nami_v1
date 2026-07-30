import { forbidden } from 'next/navigation'
import type { UserRole } from '@/lib/domain/enums'
import { assertRole } from '@/lib/auth/assert-role'
import { requireUser, type AuthContext } from '@/lib/auth/require-user'

export async function requireRole(allowed: UserRole[]): Promise<AuthContext> {
  // Role gates always re-validate JWT with Auth server.
  const auth = await requireUser({ verify: true })

  try {
    assertRole(auth.profile.role, allowed)
  } catch {
    forbidden()
  }

  return auth
}
