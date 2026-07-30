import { describe, it, expect } from 'vitest'
import { countPendingGrades, getNavItems } from '@/lib/home/build-home-model'
import { CourseEnrollmentStatus, UserRole } from '@/lib/domain/enums'

describe('getNavItems', () => {
  it('STUDENT has no admin users or courses links', () => {
    const hrefs = getNavItems(UserRole.STUDENT).map((item) => item.href)
    expect(hrefs).not.toContain('/admin/users')
    expect(hrefs).not.toContain('/admin/courses')
    expect(hrefs).not.toContain('/enrollments-admin')
  })

  it('ADMIN includes users and courses links', () => {
    const hrefs = getNavItems(UserRole.ADMIN).map((item) => item.href)
    expect(hrefs).toContain('/admin/users')
    expect(hrefs).toContain('/admin/courses')
    expect(hrefs).toContain('/admin/change-logs')
  })

  it('PROFESSOR includes teaching but not admin links', () => {
    const hrefs = getNavItems(UserRole.PROFESSOR).map((item) => item.href)
    expect(hrefs).toContain('/teaching')
    expect(hrefs).not.toContain('/admin/users')
    expect(hrefs).not.toContain('/admin/courses')
  })

  it('every role includes home and profile', () => {
    for (const role of Object.values(UserRole)) {
      const hrefs = getNavItems(role).map((item) => item.href)
      expect(hrefs).toContain('/home')
      expect(hrefs).toContain('/profile')
    }
  })
})

describe('countPendingGrades', () => {
  it('counts missing scores and zero scores still awaiting completion', () => {
    const rows = [
      { score: null, enrollment_status: CourseEnrollmentStatus.COMPLETED },
      { score: 0, enrollment_status: CourseEnrollmentStatus.APPLIED },
      { score: 0, enrollment_status: CourseEnrollmentStatus.IN_PROGRESS },
      { score: 0, enrollment_status: CourseEnrollmentStatus.COMPLETED },
      { score: 75, enrollment_status: CourseEnrollmentStatus.IN_PROGRESS },
    ]

    expect(countPendingGrades(rows)).toBe(3)
  })
})
