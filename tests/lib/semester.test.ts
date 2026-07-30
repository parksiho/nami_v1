import { describe, it, expect } from 'vitest'
import { getCurrentSemester } from '@/lib/domain/semester'

describe('getCurrentSemester', () => {
  it('defaults to 2026 / 1', () => {
    expect(getCurrentSemester(undefined, undefined)).toEqual({ year: 2026, semester: 1 })
  })
  it('reads env strings', () => {
    expect(getCurrentSemester('2025', '2')).toEqual({ year: 2025, semester: 2 })
  })
})
