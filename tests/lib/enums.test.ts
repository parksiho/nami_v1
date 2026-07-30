import { describe, it, expect } from 'vitest'
import {
  CourseEnrollmentStatus,
  AcademicStatus,
  UserRole,
} from '@/lib/domain/enums'

describe('CourseEnrollmentStatus', () => {
  it('has all 5 spec values', () => {
    expect(Object.values(CourseEnrollmentStatus)).toEqual([
      'APPLIED',
      'IN_PROGRESS',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ])
  })
})

describe('AcademicStatus', () => {
  it('has all 5 spec values', () => {
    expect(Object.values(AcademicStatus)).toEqual([
      'ADMISSION',
      'ENROLLED',
      'LEAVE',
      'EXPELLED',
      'GRADUATED',
    ])
  })
})

describe('UserRole', () => {
  it('has all 3 spec values', () => {
    expect(Object.values(UserRole)).toEqual(['STUDENT', 'PROFESSOR', 'ADMIN'])
  })
})
