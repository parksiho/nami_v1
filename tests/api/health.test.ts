import { beforeEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()
const select = vi.fn(() => ({ limit }))
const from = vi.fn(() => ({ select }))
const createClient = vi.fn(async () => ({ from }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClient(),
}))

import { dynamic, fetchCache, GET, revalidate } from '@/app/api/health/route'

describe('GET /api/health', () => {
  beforeEach(() => {
    from.mockClear()
    select.mockClear()
    limit.mockReset()
    createClient.mockClear()
  })

  it('stays dynamic so the route is not statically cached', () => {
    expect(dynamic).toBe('force-dynamic')
    expect(revalidate).toBe(0)
    expect(fetchCache).toBe('force-no-store')
  })

  it('returns ok after a minimal courses query and omits row data', async () => {
    limit.mockResolvedValue({ data: [{ id: 'secret-row' }], error: null })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(from).toHaveBeenCalledWith('courses')
    expect(select).toHaveBeenCalledWith('id')
    expect(limit).toHaveBeenCalledWith(1)
    expect(body.ok).toBe(true)
    expect(body.db).toBe('ok')
    expect(body.time).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(body).not.toHaveProperty('id')
    expect(JSON.stringify(body)).not.toContain('secret-row')
  })

  it('returns 503 when the query fails without leaking the error', async () => {
    limit.mockResolvedValue({
      data: null,
      error: { message: 'relation secrets exposed', code: '42P01' },
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ ok: false, error: 'database unavailable' })
  })

  it('returns 503 when the client cannot be created', async () => {
    createClient.mockRejectedValueOnce(new Error('missing NEXT_PUBLIC_SUPABASE_ANON_KEY'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ ok: false, error: 'database unavailable' })
  })
})
