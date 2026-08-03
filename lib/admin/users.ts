import { UserRole, type UserRole as UserRoleValue } from '@/lib/domain/enums'

export const ADMIN_USER_PAGE_SIZE = 50

export const ADMIN_USER_SORT = {
  UPDATED_DESC: 'updated_desc',
  UPDATED_ASC: 'updated_asc',
} as const

export type AdminUserSort =
  (typeof ADMIN_USER_SORT)[keyof typeof ADMIN_USER_SORT]

type SearchParams = {
  q?: string
  page?: string
  sort?: string
}

export function isAdminUserSort(value: string | undefined): value is AdminUserSort {
  return (
    value === ADMIN_USER_SORT.UPDATED_DESC ||
    value === ADMIN_USER_SORT.UPDATED_ASC
  )
}

export function getAdminUserListParams(searchParams: SearchParams) {
  const query = searchParams.q?.trim() ?? ''
  const parsedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const sort = isAdminUserSort(searchParams.sort)
    ? searchParams.sort
    : ADMIN_USER_SORT.UPDATED_DESC
  const from = (page - 1) * ADMIN_USER_PAGE_SIZE

  return {
    query,
    page,
    sort,
    pageSize: ADMIN_USER_PAGE_SIZE,
    from,
    to: from + ADMIN_USER_PAGE_SIZE - 1,
    ascending: sort === ADMIN_USER_SORT.UPDATED_ASC,
  }
}

export function isUserRole(value: string): value is UserRoleValue {
  return Object.values(UserRole).some((role) => role === value)
}

type ServiceRoleSource = Record<string, string | undefined>

export function getServiceRoleEnv(source: ServiceRoleSource = process.env) {
  const url = source.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = source.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return url && serviceRoleKey ? { url, serviceRoleKey } : null
}
