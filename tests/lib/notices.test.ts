import { describe, expect, it } from 'vitest'
import { parseNoticeFormData } from '@/lib/notices/form'

describe('parseNoticeFormData', () => {
  it('returns trimmed notice values', () => {
    const formData = new FormData()
    formData.set('title', '  Important update  ')
    formData.set('body', '  Details for everyone.  ')

    expect(parseNoticeFormData(formData)).toEqual({
      data: { title: 'Important update', body: 'Details for everyone.' },
    })
  })

  it('rejects a missing title or body', () => {
    expect(parseNoticeFormData(new FormData())).toEqual({ error: 'required' })
  })
})
