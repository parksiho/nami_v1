import type { UserRole } from '@/lib/domain/enums'

export function assertRole(userRole: UserRole, allowed: UserRole[]): void {
  if (!allowed.includes(userRole)) {
    throw new Error('FORBIDDEN')
  }
}
