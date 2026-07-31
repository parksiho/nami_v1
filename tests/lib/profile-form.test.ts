import { describe, expect, it } from 'vitest'
import { parseStudentProfileFields } from '@/lib/profile/form'

describe('parseStudentProfileFields', () => {
  it('accepts empty student number and semester', () => {
    const form = new FormData()
    expect(parseStudentProfileFields(form)).toEqual({
      ok: true,
      data: { student_number: null, enrolled_semester: null },
    })
  })

  it('parses student number and enrolled semester', () => {
    const form = new FormData()
    form.set('student_number', '202301005A')
    form.set('enrolled_semester', '4')
    expect(parseStudentProfileFields(form)).toEqual({
      ok: true,
      data: { student_number: '202301005A', enrolled_semester: 4 },
    })
  })

  it('allows zero for graduated legacy semester values', () => {
    const form = new FormData()
    form.set('enrolled_semester', '0')
    expect(parseStudentProfileFields(form)).toEqual({
      ok: true,
      data: { student_number: null, enrolled_semester: 0 },
    })
  })

  it('rejects non-integer enrolled semester', () => {
    const form = new FormData()
    form.set('enrolled_semester', '1.5')
    expect(parseStudentProfileFields(form)).toEqual({
      ok: false,
      error: 'invalidSemester',
    })
  })
})
