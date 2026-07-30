import {
  CourseEnrollmentStatus,
  type CourseEnrollmentStatus as CourseEnrollmentStatusValue,
} from '@/lib/domain/enums'

const ENROLLMENT_STATUSES = new Set<string>(
  Object.values(CourseEnrollmentStatus),
)

export type ScoreUpdate = {
  score: number | null
  pass: boolean
  enrollmentStatus: CourseEnrollmentStatusValue
}

export function parseScoreUpdate(
  formData: FormData,
): { data: ScoreUpdate } | { error: 'invalidScore' | 'invalidStatus' } {
  const rawScore = String(formData.get('score') ?? '').trim()
  const status = String(formData.get('status') ?? '')

  if (!ENROLLMENT_STATUSES.has(status)) {
    return { error: 'invalidStatus' }
  }

  const score = rawScore === '' ? null : Number(rawScore)
  if (
    score !== null
    && (!Number.isInteger(score) || score < 0 || score > 100)
  ) {
    return { error: 'invalidScore' }
  }

  return {
    data: {
      score,
      pass: formData.get('pass') === 'true',
      enrollmentStatus: status as CourseEnrollmentStatusValue,
    },
  }
}

export function assertProfessorOwnsStudent(
  ownedStudentIds: readonly string[],
  studentId: string,
): void {
  if (!ownedStudentIds.includes(studentId)) {
    throw new Error('FORBIDDEN')
  }
}
