import { describe, expect, it, vi } from 'vitest'
import { purgeProfileDependencies } from '@/lib/admin/delete-user'

function createMockAdmin() {
  const calls: string[] = []
  const chain = (label: string) => {
    const api = {
      delete: () => {
        calls.push(`${label}:delete`)
        return api
      },
      update: () => {
        calls.push(`${label}:update`)
        return api
      },
      eq: () => Promise.resolve({ error: null }),
      list: async () => {
        calls.push(`${label}:list`)
        return { data: [], error: null }
      },
      remove: async () => {
        calls.push(`${label}:remove`)
        return { error: null }
      },
    }
    return api
  }

  return {
    calls,
    admin: {
      from: (table: string) => chain(table),
      storage: {
        from: (bucket: string) => chain(`storage:${bucket}`),
      },
    },
  }
}

describe('purgeProfileDependencies', () => {
  it('clears dependent rows before auth user deletion', async () => {
    const { admin, calls } = createMockAdmin()
    const result = await purgeProfileDependencies(admin as never, 'user-1')
    expect(result).toEqual({})
    expect(calls).toEqual([
      'change_logs:delete',
      'notices:delete',
      'enrollment_history:update',
      'enrollment_history:update',
      'enrollment_history:delete',
      'enrollment_records:update',
      'enrollment_records:delete',
      'student_courses:delete',
      'courses:delete',
      'storage:avatars:list',
    ])
  })

  it('returns storage list errors', async () => {
    const { admin } = createMockAdmin()
    vi.spyOn(admin.storage, 'from').mockReturnValue({
      list: async () => ({ data: null, error: { message: 'storage down' } }),
      remove: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
      eq: async () => ({ error: null }),
    } as never)

    // Make table steps succeed by keeping original from(), only storage fails.
    const result = await purgeProfileDependencies(admin as never, 'user-1')
    expect(result.error).toBe('storage down')
  })
})
