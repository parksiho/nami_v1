import type { AcademicStatus } from '@/lib/domain/enums'

export type EnrollmentHistorySource = {
  id: string
  student_id: string
  status: AcademicStatus
  change_reason: string | null
  leave_start: string | null
  leave_end: string | null
  advisor_professor_id: string | null
}

export type EnrollmentHistoryInsert = {
  enrollment_record_id: string
  student_id: string
  from_status: AcademicStatus
  to_status: AcademicStatus
  reason: string | null
  leave_start: string | null
  leave_end: string | null
  advisor_id: string | null
  changed_by: string
}

const trackedKeys = [
  'status',
  'change_reason',
  'leave_start',
  'leave_end',
  'advisor_professor_id',
] as const

export function appendHistory(
  previous: EnrollmentHistorySource,
  next: EnrollmentHistorySource,
  actorId: string,
): EnrollmentHistoryInsert | null {
  if (trackedKeys.every((key) => previous[key] === next[key])) return null

  return {
    enrollment_record_id: next.id,
    student_id: next.student_id,
    from_status: previous.status,
    to_status: next.status,
    reason: next.change_reason,
    leave_start: next.leave_start,
    leave_end: next.leave_end,
    advisor_id: next.advisor_professor_id,
    changed_by: actorId,
  }
}
