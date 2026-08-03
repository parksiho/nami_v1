import { describe, expect, it } from 'vitest'
import {
  ADMIN_USER_SORT,
  getAdminUserListParams,
  getServiceRoleEnv,
  isAdminUserSort,
  isUserRole,
} from '@/lib/admin/users'

describe('admin user helpers', () => {
  it('normalizes search, sort, and page with a page size of 50', () => {
    expect(
      getAdminUserListParams({
        q: '  Ana  ',
        page: '3',
        sort: ADMIN_USER_SORT.UPDATED_ASC,
      }),
    ).toEqual({
      query: 'Ana',
      page: 3,
      sort: ADMIN_USER_SORT.UPDATED_ASC,
      pageSize: 50,
      from: 100,
      to: 149,
      ascending: true,
    })
  })

  it('defaults to newest-updated sort', () => {
    expect(getAdminUserListParams({}).sort).toBe(ADMIN_USER_SORT.UPDATED_DESC)
    expect(getAdminUserListParams({}).ascending).toBe(false)
  })

  it('falls back to the first page for invalid page values', () => {
    expect(getAdminUserListParams({ page: '-2' }).page).toBe(1)
    expect(getAdminUserListParams({ page: 'abc' }).page).toBe(1)
  })

  it('accepts only known sort values', () => {
    expect(isAdminUserSort('updated_desc')).toBe(true)
    expect(isAdminUserSort('updated_asc')).toBe(true)
    expect(isAdminUserSort('name')).toBe(false)
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
