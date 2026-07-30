import { describe, expect, it } from 'vitest'
import {
  getAdminUserListParams,
  getServiceRoleEnv,
  isUserRole,
} from '@/lib/admin/users'

describe('admin user helpers', () => {
  it('normalizes search and page while keeping a page size of 10', () => {
    expect(getAdminUserListParams({ q: '  Ana  ', page: '3' })).toEqual({
      query: 'Ana',
      page: 3,
      pageSize: 10,
      from: 20,
      to: 29,
    })
  })

  it('falls back to the first page for invalid page values', () => {
    expect(getAdminUserListParams({ page: '-2' }).page).toBe(1)
    expect(getAdminUserListParams({ page: 'abc' }).page).toBe(1)
  })

  it('accepts only known profile roles', () => {
    expect(isUserRole('ADMIN')).toBe(true)
    expect(isUserRole('PROFESSOR')).toBe(true)
    expect(isUserRole('OWNER')).toBe(false)
  })

  it('returns service credentials only when both values exist', () => {
    expect(getServiceRoleEnv({})).toBeNull()
    expect(
      getServiceRoleEnv({
        NEXT_PUBLIC_SUPABASE_URL: ' https://example.supabase.co ',
        SUPABASE_SERVICE_ROLE_KEY: ' secret ',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'secret',
    })
  })
})
