import { describe, expect, it } from 'vitest'
import {
  getAdminCourseListParams,
  parseCourseFormData,
} from '@/lib/admin/courses'

describe('admin course helpers', () => {
  it('normalizes name, professor, and page filters with a page size of 10', () => {
    expect(
      getAdminCourseListParams({
        q: '  Theology  ',
        professorId: '  professor-1  ',
        page: '3',
      }),
    ).toEqual({
      query: 'Theology',
      professorId: 'professor-1',
      page: 3,
      pageSize: 10,
      from: 20,
      to: 29,
    })
  })

  it('falls back to the first page for invalid page values', () => {
    expect(getAdminCourseListParams({ page: '0' }).page).toBe(1)
    expect(getAdminCourseListParams({ page: 'invalid' }).page).toBe(1)
  })

  it('parses valid course form values as integers', () => {
    const formData = new FormData()
    formData.set('name', '  Greek I  ')
    formData.set('professorId', 'professor-1')
    formData.set('year', '2026')
    formData.set('semester', '2')
    formData.set('credit', '3')

    expect(parseCourseFormData(formData)).toEqual({
      data: {
        name: 'Greek I',
        professorId: 'professor-1',
        year: 2026,
        semester: 2,
        credit: 3,
      },
    })
  })

  it('rejects missing fields and invalid numeric values', () => {
    const missing = new FormData()
    expect(parseCourseFormData(missing)).toEqual({ error: 'required' })

    const invalid = new FormData()
    invalid.set('name', 'Greek I')
    invalid.set('professorId', 'professor-1')
    invalid.set('year', '2026.5')
    invalid.set('semester', '3')
    invalid.set('credit', '0')
    expect(parseCourseFormData(invalid)).toEqual({ error: 'invalidNumbers' })
  })
})
