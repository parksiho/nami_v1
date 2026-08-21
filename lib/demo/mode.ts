import { cookies } from 'next/headers'
import { UserRole, type UserRole as UserRoleValue } from '@/lib/domain/enums'

export const UI_DEMO_COOKIE = 'nami_demo_role'

export async function getDemoRole(): Promise<UserRoleValue> {
  const store = await cookies()
  const value = store.get(UI_DEMO_COOKIE)?.value
  if (value === UserRole.PROFESSOR || value === UserRole.ADMIN) {
    return value
  }
  return UserRole.STUDENT
}
