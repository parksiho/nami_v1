import { AcademicStatus, type AcademicStatus as AcademicStatusType } from '@/lib/domain/enums'

export type EnrollmentFormValues = {
  studentId: string
  gradeYear: number | null
  year: number
  semester: number
  status: AcademicStatusType
  entranceInfo: string | null
  graduateInfo: string | null
  changeReason: string | null
  leaveStart: string | null
  leaveEnd: string | null
  advisorProfessorId: string | null
}

export type EnrollmentFormResult = { data: EnrollmentFormValues } | { error: 'required' | 'invalid' }

const statuses = new Set<string>(Object.values(AcademicStatus))
const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim()
const nullable = (form: FormData, name: string) => text(form, name) || null

export function parseEnrollmentFormData(form: FormData): EnrollmentFormResult {
  const studentId = text(form, 'studentId')
  const year = Number(text(form, 'year'))
  const semester = Number(text(form, 'semester'))
  const gradeYearRaw = text(form, 'gradeYear')
  const gradeYear = gradeYearRaw ? Number(gradeYearRaw) : null
  const status = text(form, 'status')
  const leaveStart = nullable(form, 'leaveStart')
  const leaveEnd = nullable(form, 'leaveEnd')

  if (!studentId || !text(form, 'year') || !status) return { error: 'required' }
  if (
    !Number.isInteger(year)
    || year < 1
    || ![1, 2].includes(semester)
    || (gradeYear !== null && (!Number.isInteger(gradeYear) || gradeYear < 1))
    || !statuses.has(status)
    || (leaveStart && leaveEnd && leaveStart > leaveEnd)
  ) return { error: 'invalid' }

  return {
    data: {
      studentId,
      gradeYear,
      year,
      semester,
      status: status as AcademicStatusType,
      entranceInfo: nullable(form, 'entrance'),
      graduateInfo: nullable(form, 'graduate'),
      changeReason: nullable(form, 'changeReason'),
      leaveStart,
      leaveEnd,
      advisorProfessorId: nullable(form, 'advisorProfessorId'),
    },
  }
}
