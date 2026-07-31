export function optionalFormValue(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? '').trim()
  return value || null
}

export function parseOptionalInteger(
  formData: FormData,
  field: string,
): { ok: true; value: number | null } | { ok: false } {
  const raw = optionalFormValue(formData, field)
  if (raw === null) return { ok: true, value: null }
  const value = Number(raw)
  if (!Number.isInteger(value)) return { ok: false }
  return { ok: true, value }
}

export type StudentProfileFields = {
  student_number: string | null
  enrolled_semester: number | null
}

export function parseStudentProfileFields(
  formData: FormData,
): { ok: true; data: StudentProfileFields } | { ok: false; error: 'invalidSemester' } {
  const semester = parseOptionalInteger(formData, 'enrolled_semester')
  if (!semester.ok) return { ok: false, error: 'invalidSemester' }

  return {
    ok: true,
    data: {
      student_number: optionalFormValue(formData, 'student_number'),
      enrolled_semester: semester.value,
    },
  }
}
