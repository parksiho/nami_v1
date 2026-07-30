import { describe, expect, it } from 'vitest'
import {
  assertProfessorOwnsStudent,
  parseScoreUpdate,
} from '@/lib/teaching/grades'
import { CourseEnrollmentStatus } from '@/lib/domain/enums'

describe('teaching grade helpers', () => {
  it('parses an inline grade, pass result, and enrollment status', () => {
    const formData = new FormData()
    formData.set('score', '88')
    formData.set('pass', 'true')
    formData.set('status', CourseEnrollmentStatus.COMPLETED)

    expect(parseScoreUpdate(formData)).toEqual({
      data: {
        score: 88,
        pass: true,
        enrollmentStatus: CourseEnrollmentStatus.COMPLETED,
      },
    })
  })

  it('allows an empty score and unchecked pass result', () => {
    const formData = new FormData()
    formData.set('score', '')
    formData.set('status', CourseEnrollmentStatus.IN_PROGRESS)

    expect(parseScoreUpdate(formData)).toEqual({
      data: {
        score: null,
        pass: false,
        enrollmentStatus: CourseEnrollmentStatus.IN_PROGRESS,
      },
    })
  })

  it('rejects scores outside the integer range from zero to one hundred', () => {
    for (const score of ['-1', '101', '80.5', 'not-a-number']) {
      const formData = new FormData()
      formData.set('score', score)
      formData.set('status', CourseEnrollmentStatus.COMPLETED)

      expect(parseScoreUpdate(formData)).toEqual({ error: 'invalidScore' })
    }
  })

  it('rejects unknown enrollment statuses', () => {
    const formData = new FormData()
    formData.set('score', '70')
    formData.set('status', 'UNKNOWN')

    expect(parseScoreUpdate(formData)).toEqual({ error: 'invalidStatus' })
  })

  it('rejects access when the professor does not teach the student', () => {
    expect(() => assertProfessorOwnsStudent(['student-1'], 'student-2'))
      .toThrow('FORBIDDEN')
    expect(() => assertProfessorOwnsStudent(['student-1'], 'student-1'))
      .not.toThrow()
  })
})
