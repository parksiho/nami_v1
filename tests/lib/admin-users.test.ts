import { describe, expect, it } from 'vitest'
import {
  ADMIN_USER_SORT,
  buildAdminUserListQuery,
  getAdminUserListParams,
  getServiceRoleEnv,
  isAdminUserRoleFilter,
  isAdminUserSort,
  isUserRole,
} from '@/lib/admin/users'

describe('admin user helpers', () => {
  it('normalizes search, filters, sort, and page with a page size of 50', () => {
    expect(
      getAdminUserListParams({
        q: '  Ana  ',
        page: '3',
        sort: ADMIN_USER_SORT.UPDATED_ASC,
        role: 'STUDENT',
        academicStatus: 'ENROLLED',
        admissionYear: '2022',
      }),
    ).toEqual({
      query: 'Ana',
      page: 3,
      sort: ADMIN_USER_SORT.UPDATED_ASC,
      role: 'STUDENT',
      academicStatus: 'ENROLLED',
      admissionYear: 2022,
      hasFilters: true,
      pageSize: 50,
      from: 100,
      to: 149,
      ascending: true,
    })
  })

  it('defaults to newest-updated sort with no filters', () => {
    expect(getAdminUserListParams({})).toMatchObject({
      sort: ADMIN_USER_SORT.UPDATED_DESC,
      ascending: false,
      role: '',
      academicStatus: '',
      admissionYear: null,
      hasFilters: false,
    })
  })

  it('falls back to the first page for invalid page values', () => {
    expect(getAdminUserListParams({ page: '-2' }).page).toBe(1)
    expect(getAdminUserListParams({ page: 'abc' }).page).toBe(1)
  })

  it('accepts only known sort and role filter values', () => {
    expect(isAdminUserSort('updated_desc')).toBe(true)
    expect(isAdminUserSort('name')).toBe(false)
    expect(isAdminUserRoleFilter('STUDENT')).toBe(true)
    expect(isAdminUserRoleFilter('ADMIN')).toBe(false)
  })

  it('builds list query params for pagination links', () => {
    const list = getAdminUserListParams({
      role: 'PROFESSOR',
      admissionYear: '2020',
      academicStatus: 'LEAVE',
    })
    expect(buildAdminUserListQuery(list, 2)).toEqual({
      role: 'PROFESSOR',
      admissionYear: '2020',
      academicStatus: 'LEAVE',
      page: 2,
    })
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
