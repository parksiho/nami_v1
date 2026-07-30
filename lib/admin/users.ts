import { UserRole, type UserRole as UserRoleValue } from '@/lib/domain/enums'

export const ADMIN_USER_PAGE_SIZE = 10

type SearchParams = {
  q?: string
  page?: string
}

export function getAdminUserListParams(searchParams: SearchParams) {
  const query = searchParams.q?.trim() ?? ''
  const parsedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const from = (page - 1) * ADMIN_USER_PAGE_SIZE

  return {
    query,
    page,
    pageSize: ADMIN_USER_PAGE_SIZE,
    from,
    to: from + ADMIN_USER_PAGE_SIZE - 1,
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
