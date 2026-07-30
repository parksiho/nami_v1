import { CourseEnrollmentStatus, UserRole } from '@/lib/domain/enums'

export type NavItem = {
  href: string
  labelKey: string
}

const BASE: NavItem[] = [
  { href: '/home', labelKey: 'home' },
  { href: '/profile', labelKey: 'profile' },
]

const NOTICES: NavItem = { href: '/notices', labelKey: 'notices' }

const byRole: Record<UserRole, NavItem[]> = {
  [UserRole.STUDENT]: [
    ...BASE,
    { href: '/enroll', labelKey: 'enroll' },
    { href: '/grades', labelKey: 'grades' },
    { href: '/enrollment', labelKey: 'enrollment' },
    NOTICES,
  ],
  [UserRole.PROFESSOR]: [
    ...BASE,
    { href: '/teaching', labelKey: 'teaching' },
    NOTICES,
  ],
  [UserRole.ADMIN]: [
    ...BASE,
    { href: '/admin/users', labelKey: 'users' },
    { href: '/admin/courses', labelKey: 'courses' },
    { href: '/admin/enrollments', labelKey: 'enrollmentsAdmin' },
    NOTICES,
    { href: '/admin/change-logs', labelKey: 'changeLogs' },
  ],
}

export function getNavItems(role: UserRole): NavItem[] {
  return byRole[role]
}

export type HomeModel = {
  welcomeKey: string
  shortcuts: NavItem[]
}

const welcomeByRole: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'welcomeStudent',
  [UserRole.PROFESSOR]: 'welcomeProfessor',
  [UserRole.ADMIN]: 'welcomeAdmin',
}

export function buildHomeModel(role: UserRole): HomeModel {
  const navItems = getNavItems(role)
  const shortcuts = navItems.filter(
    (item) => item.href !== '/home' && item.labelKey !== 'notices',
  )

  return {
    welcomeKey: welcomeByRole[role],
    shortcuts,
  }
}

type GradeSummaryRow = {
  score: number | null
  enrollment_status: string
}

/**
 * A zero is still treated as pending while a course is APPLIED or IN_PROGRESS.
 * Once a course reaches a terminal status, zero is a recorded grade.
 */
export function countPendingGrades(rows: GradeSummaryRow[]): number {
  return rows.filter(
    (row) =>
      row.score === null ||
      (row.score === 0 &&
        (row.enrollment_status === CourseEnrollmentStatus.APPLIED ||
          row.enrollment_status === CourseEnrollmentStatus.IN_PROGRESS)),
  ).length
}
