import { describe, expect, it } from 'vitest'
import {
  buildStudentAcademicMap,
  collectAdmissionYears,
  filterStudentIdsByAcademic,
  parseAdmissionYearFromStudentNumber,
} from '@/lib/admin/user-academic'

describe('admin user academic helpers', () => {
  it('parses admission year from student numbers', () => {
    expect(parseAdmissionYearFromStudentNumber('202201002A')).toBe(2022)
    expect(parseAdmissionYearFromStudentNumber('201801001')).toBe(2018)
    expect(parseAdmissionYearFromStudentNumber('abc')).toBeNull()
    expect(parseAdmissionYearFromStudentNumber(null)).toBeNull()
  })

  it('builds current academic status and admission year map', () => {
    const map = buildStudentAcademicMap(
      [
        { id: 's1', student_number: '202201001A' },
        { id: 's2', student_number: null },
      ],
      [
        { student_id: 's1', year: 2025, semester: 1, status: 'ENROLLED' },
        { student_id: 's1', year: 2026, semester: 1, status: 'LEAVE' },
        { student_id: 's2', year: 2024, semester: 2, status: 'ENROLLED' },
        { student_id: 's2', year: 2023, semester: 1, status: 'ADMISSION' },
      ],
    )

    expect(map.get('s1')).toEqual({
      academicStatus: 'LEAVE',
      admissionYear: 2022,
    })
    expect(map.get('s2')).toEqual({
      academicStatus: 'ENROLLED',
      admissionYear: 2023,
    })
    expect(collectAdmissionYears(map)).toEqual([2023, 2022])
  })

  it('filters student ids by academic status and admission year', () => {
    const map = buildStudentAcademicMap(
      [
        { id: 'a', student_number: '202201001' },
        { id: 'b', student_number: '202401001' },
        { id: 'c', student_number: '202201002' },
      ],
      [
        { student_id: 'a', year: 2026, semester: 1, status: 'ENROLLED' },
        { student_id: 'b', year: 2026, semester: 1, status: 'LEAVE' },
        { student_id: 'c', year: 2026, semester: 1, status: 'EXPELLED' },
      ],
    )

    expect(
      filterStudentIdsByAcademic(map, {
        academicStatus: 'ENROLLED',
        admissionYear: 2022,
      }),
    ).toEqual(['a'])
    expect(
      filterStudentIdsByAcademic(map, { academicStatus: 'LEAVE' }),
    ).toEqual(['b'])
  })
})
