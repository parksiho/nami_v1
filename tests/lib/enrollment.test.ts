import { describe, expect, it } from 'vitest'
import { appendHistory } from '@/lib/enrollment/append-history'
import { parseEnrollmentFormData } from '@/lib/enrollment/form'

const previous = {
  id: 'record-1',
  student_id: 'student-1',
  status: 'ENROLLED' as const,
  change_reason: null,
  leave_start: null,
  leave_end: null,
  advisor_professor_id: 'professor-1',
}

describe('appendHistory', () => {
  it('skips history when tracked values did not change', () => {
    expect(appendHistory(previous, { ...previous }, 'admin-1')).toBeNull()
  })

  it('appends history when only the reason changes', () => {
    expect(
      appendHistory(previous, { ...previous, change_reason: 'Transfer approved' }, 'admin-1'),
    ).toEqual({
      enrollment_record_id: 'record-1',
      student_id: 'student-1',
      from_status: 'ENROLLED',
      to_status: 'ENROLLED',
      reason: 'Transfer approved',
      leave_start: null,
      leave_end: null,
      advisor_id: 'professor-1',
      changed_by: 'admin-1',
    })
  })

  it('appends history for status, leave date, or advisor changes', () => {
    const next = {
      ...previous,
      status: 'LEAVE' as const,
      leave_start: '2026-08-01',
      leave_end: '2027-02-01',
      advisor_professor_id: 'professor-2',
    }
    expect(appendHistory(previous, next, 'admin-1')).toMatchObject({
      from_status: 'ENROLLED',
      to_status: 'LEAVE',
      leave_start: '2026-08-01',
      leave_end: '2027-02-01',
      advisor_id: 'professor-2',
    })
  })
})

describe('parseEnrollmentFormData', () => {
  it('parses the complete academic record form', () => {
    const form = new FormData()
    form.set('studentId', 'student-1')
    form.set('gradeYear', '2')
    form.set('year', '2026')
    form.set('semester', '1')
    form.set('status', 'LEAVE')
    form.set('entrance', '2025 admission')
    form.set('graduate', '')
    form.set('changeReason', 'Family leave')
    form.set('leaveStart', '2026-08-01')
    form.set('leaveEnd', '2027-02-01')
    form.set('advisorProfessorId', 'professor-1')

    expect(parseEnrollmentFormData(form)).toEqual({
      data: {
        studentId: 'student-1',
        gradeYear: 2,
        year: 2026,
        semester: 1,
        status: 'LEAVE',
        entranceInfo: '2025 admission',
        graduateInfo: null,
        changeReason: 'Family leave',
        leaveStart: '2026-08-01',
        leaveEnd: '2027-02-01',
        advisorProfessorId: 'professor-1',
      },
    })
  })

  it('rejects invalid status, term, and reversed leave dates', () => {
    const form = new FormData()
    form.set('studentId', 'student-1')
    form.set('gradeYear', '1')
    form.set('year', '2026')
    form.set('semester', '3')
    form.set('status', 'UNKNOWN')
    form.set('leaveStart', '2027-01-01')
    form.set('leaveEnd', '2026-01-01')
    expect(parseEnrollmentFormData(form)).toEqual({ error: 'invalid' })
  })
})
