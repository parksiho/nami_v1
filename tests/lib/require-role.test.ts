import { describe, it, expect } from 'vitest'
import { assertRole } from '@/lib/auth/assert-role'
import { UserRole } from '@/lib/domain/enums'

describe('assertRole', () => {
  it('allows when user role is in allowed list', () => {
    expect(() =>
      assertRole(UserRole.STUDENT, [UserRole.STUDENT, UserRole.ADMIN]),
    ).not.toThrow()
  })

  it('allows when user role matches single allowed role', () => {
    expect(() => assertRole(UserRole.ADMIN, [UserRole.ADMIN])).not.toThrow()
  })

  it('throws FORBIDDEN when role is not allowed', () => {
    expect(() => assertRole(UserRole.STUDENT, [UserRole.ADMIN])).toThrow(
      'FORBIDDEN',
    )
  })

  it('throws FORBIDDEN when allowed list is empty', () => {
    expect(() => assertRole(UserRole.STUDENT, [])).toThrow('FORBIDDEN')
  })
})
