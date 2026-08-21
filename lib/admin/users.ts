import {
  isAdminAcademicFilter,
  type AdminAcademicFilter,
} from '@/lib/admin/user-academic'
import { UserRole, type UserRole as UserRoleValue } from '@/lib/domain/enums'

export const ADMIN_USER_PAGE_SIZE = 50

export const ADMIN_USER_SORT = {
  UPDATED_DESC: 'updated_desc',
  UPDATED_ASC: 'updated_asc',
} as const

export type AdminUserSort =
  (typeof ADMIN_USER_SORT)[keyof typeof ADMIN_USER_SORT]

export const ADMIN_USER_ROLE_FILTERS = [
  UserRole.STUDENT,
  UserRole.PROFESSOR,
] as const

export type AdminUserRoleFilter = (typeof ADMIN_USER_ROLE_FILTERS)[number]

type SearchParams = {
  q?: string
  page?: string
  sort?: string
  role?: string
  academicStatus?: string
  admissionYear?: string
}

export function isAdminUserSort(value: string | undefined): value is AdminUserSort {
  return (
    value === ADMIN_USER_SORT.UPDATED_DESC ||
    value === ADMIN_USER_SORT.UPDATED_ASC
  )
}

export function isAdminUserRoleFilter(
  value: string | undefined,
): value is AdminUserRoleFilter {
  return ADMIN_USER_ROLE_FILTERS.some((role) => role === value)
}

export function getAdminUserListParams(searchParams: SearchParams) {
  const query = searchParams.q?.trim() ?? ''
  const parsedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const sort = isAdminUserSort(searchParams.sort)
    ? searchParams.sort
    : ADMIN_USER_SORT.UPDATED_DESC
  const role = isAdminUserRoleFilter(searchParams.role) ? searchParams.role : ''
  const academicStatus = isAdminAcademicFilter(searchParams.academicStatus)
    ? searchParams.academicStatus
    : ('' as AdminAcademicFilter | '')
  const parsedYear = Number.parseInt(searchParams.admissionYear ?? '', 10)
  const admissionYear =
    Number.isFinite(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100
      ? parsedYear
      : null
  const from = (page - 1) * ADMIN_USER_PAGE_SIZE
  const hasFilters = Boolean(query || role || academicStatus || admissionYear)

  return {
    query,
    page,
    sort,
    role,
    academicStatus,
    admissionYear,
    hasFilters,
    pageSize: ADMIN_USER_PAGE_SIZE,
    from,
    to: from + ADMIN_USER_PAGE_SIZE - 1,
    ascending: sort === ADMIN_USER_SORT.UPDATED_ASC,
  }
}

export function buildAdminUserListQuery(
  list: ReturnType<typeof getAdminUserListParams>,
  page = list.page,
) {
  return {
    ...(list.query ? { q: list.query } : {}),
    ...(list.role ? { role: list.role } : {}),
    ...(list.academicStatus ? { academicStatus: list.academicStatus } : {}),
    ...(list.admissionYear ? { admissionYear: String(list.admissionYear) } : {}),
    ...(list.sort !== ADMIN_USER_SORT.UPDATED_DESC ? { sort: list.sort } : {}),
    page,
  }
}

export function isUserRole(value: string): value is UserRoleValue {
  return Object.values(UserRole).some((role) => role === value)
}

type ServiceRoleSource = Record<string, string | undefined>

export function getServiceRoleEnv(source: ServiceRoleSource = process.env) {
  if (source.NAMI_UI_DEMO === '1' || process.env.NAMI_UI_DEMO === '1') {
    return { url: 'https://demo.local', serviceRoleKey: 'demo' }
  }

  const url = source.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = source.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return url && serviceRoleKey ? { url, serviceRoleKey } : null
}
