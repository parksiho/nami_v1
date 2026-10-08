import { cookies } from 'next/headers'
import { isUiDemo } from '@/lib/demo/guard'
import { UserRole, type UserRole as UserRoleValue } from '@/lib/domain/enums'

export const UI_DEMO_COOKIE = 'nami_demo_role'

/** Cookie role used for screenshots. Null when demo mode is off, including production. */
export async function getDemoRole(): Promise<UserRoleValue | null> {
  if (!isUiDemo()) return null

  const store = await cookies()
  const value = store.get(UI_DEMO_COOKIE)?.value
  if (value === UserRole.PROFESSOR || value === UserRole.ADMIN) {
    return value
  }
  return UserRole.STUDENT
}
