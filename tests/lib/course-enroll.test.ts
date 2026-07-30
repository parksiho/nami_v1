import { describe, expect, it } from 'vitest'
import { canEnroll } from '@/lib/courses/enroll'

describe('canEnroll', () => {
  it('returns false when the course is already enrolled', () => {
    expect(canEnroll(['course-1', 'course-2'], 'course-2')).toBe(false)
  })

  it('returns true when the course is not enrolled', () => {
    expect(canEnroll(['course-1', 'course-2'], 'course-3')).toBe(true)
  })
})
