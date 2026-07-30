export const CourseEnrollmentStatus = {
  APPLIED: 'APPLIED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const
export type CourseEnrollmentStatus =
  (typeof CourseEnrollmentStatus)[keyof typeof CourseEnrollmentStatus]

export const AcademicStatus = {
  ADMISSION: 'ADMISSION',
  ENROLLED: 'ENROLLED',
  LEAVE: 'LEAVE',
  EXPELLED: 'EXPELLED',
  GRADUATED: 'GRADUATED',
} as const
export type AcademicStatus = (typeof AcademicStatus)[keyof typeof AcademicStatus]

export const UserRole = {
  STUDENT: 'STUDENT',
  PROFESSOR: 'PROFESSOR',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]
