import { describe, expect, it } from 'vitest'
import { getChangeLogListParams } from '@/lib/changelog/list'

describe('getChangeLogListParams', () => {
  it('uses twenty rows and a one-based page', () => {
    expect(getChangeLogListParams({ page: '2' })).toEqual({
      page: 2,
      pageSize: 20,
      from: 20,
      to: 39,
    })
  })

  it('falls back to the first page for invalid input', () => {
    expect(getChangeLogListParams({ page: '-4' }).page).toBe(1)
    expect(getChangeLogListParams({ page: 'abc' }).page).toBe(1)
  })
})
