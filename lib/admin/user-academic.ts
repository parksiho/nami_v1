import {
  AcademicStatus,
  type AcademicStatus as AcademicStatusValue,
} from '@/lib/domain/enums'

export const ADMIN_ACADEMIC_FILTERS = [
  AcademicStatus.ENROLLED,
  AcademicStatus.LEAVE,
  AcademicStatus.EXPELLED,
] as const

export type AdminAcademicFilter = (typeof ADMIN_ACADEMIC_FILTERS)[number]

export type StudentAcademicInfo = {
  academicStatus: AcademicStatusValue | null
  admissionYear: number | null
}

type EnrollmentRow = {
  student_id: string
  year: number
  semester: number
  status: string
}

type StudentNumberRow = {
  id: string
  student_number: string | null
}

export function isAdminAcademicFilter(
  value: string | undefined,
): value is AdminAcademicFilter {
  return ADMIN_ACADEMIC_FILTERS.some((status) => status === value)
}

export function parseAdmissionYearFromStudentNumber(
  studentNumber: string | null | undefined,
): number | null {
  if (!studentNumber) return null
  const match = studentNumber.trim().match(/^(19|20)\d{2}/)
  if (!match) return null
  return Number.parseInt(match[0], 10)
}

export function buildStudentAcademicMap(
  students: StudentNumberRow[],
  enrollments: EnrollmentRow[],
): Map<string, StudentAcademicInfo> {
  const latest = new Map<string, EnrollmentRow>()
  const minYear = new Map<string, number>()

  for (const row of enrollments) {
    const currentMin = minYear.get(row.student_id)
    if (currentMin === undefined || row.year < currentMin) {
      minYear.set(row.student_id, row.year)
    }

    const current = latest.get(row.student_id)
    if (
      !current ||
      row.year > current.year ||
      (row.year === current.year && row.semester > current.semester)
    ) {
      latest.set(row.student_id, row)
    }
  }

  const map = new Map<string, StudentAcademicInfo>()
  for (const student of students) {
    const fromNumber = parseAdmissionYearFromStudentNumber(student.student_number)
    const latestRow = latest.get(student.id)
    map.set(student.id, {
      academicStatus: (latestRow?.status as AcademicStatusValue | undefined) ?? null,
      admissionYear: fromNumber ?? minYear.get(student.id) ?? null,
    })
  }
  return map
}

export function filterStudentIdsByAcademic(
  academicMap: Map<string, StudentAcademicInfo>,
  options: {
    academicStatus?: AdminAcademicFilter | ''
    admissionYear?: number | null
  },
): string[] {
  const status = options.academicStatus || ''
  const year = options.admissionYear ?? null

  return [...academicMap.entries()]
    .filter(([, info]) => {
      if (status && info.academicStatus !== status) return false
      if (year !== null && info.admissionYear !== year) return false
      return true
    })
    .map(([id]) => id)
}

export function collectAdmissionYears(
  academicMap: Map<string, StudentAcademicInfo>,
): number[] {
  const years = new Set<number>()
  for (const info of academicMap.values()) {
    if (info.admissionYear !== null) years.add(info.admissionYear)
  }
  return [...years].sort((a, b) => b - a)
}
