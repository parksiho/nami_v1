import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServiceRoleEnv } from '@/lib/admin/users'
import { requireUser } from '@/lib/auth/require-user'
import { DEMO_IDS } from '@/lib/demo/data'
import { isProductionRuntime, isUiDemo, resetDemoGuardForTests } from '@/lib/demo/guard'
import { getDemoRole, UI_DEMO_COOKIE } from '@/lib/demo/mode'
import { UserRole } from '@/lib/domain/enums'

const cookieJar = new Map<string, string>()

function assignEnv(key: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>
  if (value === undefined) delete env[key]
  else env[key] = value
}

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value === undefined ? undefined : { name, value }
    },
  }),
}))

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'ko',
}))

vi.mock('@/i18n/navigation', () => ({
  redirect: () => {
    throw new Error('REDIRECT_LOGIN')
  },
}))

describe('UI demo guard', () => {
  const envKeys = [
    'NAMI_UI_DEMO',
    'NODE_ENV',
    'VERCEL_ENV',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  ] as const
  const saved: Partial<Record<(typeof envKeys)[number], string | undefined>> = {}
  let errorLog!: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetDemoGuardForTests()
    cookieJar.clear()
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const key of envKeys) {
      saved[key] = process.env[key]
    }
  })

  afterEach(() => {
    for (const key of envKeys) {
      assignEnv(key, saved[key])
    }
    vi.restoreAllMocks()
  })

  it('is off by default', () => {
    expect(isUiDemo({})).toBe(false)
    expect(isUiDemo({ NODE_ENV: 'development' })).toBe(false)
    expect(isUiDemo({ NODE_ENV: 'test' })).toBe(false)
  })

  it('turns on in development when the flag is set', () => {
    expect(isUiDemo({ NAMI_UI_DEMO: '1', NODE_ENV: 'development' })).toBe(true)
    expect(isUiDemo({ NAMI_UI_DEMO: '1', NODE_ENV: 'test' })).toBe(true)
    expect(isUiDemo({ NAMI_UI_DEMO: '1' })).toBe(true)
  })

  it('stays on for Vercel preview even though NODE_ENV is production', () => {
    expect(
      isProductionRuntime({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }),
    ).toBe(false)
    expect(
      isUiDemo({
        NAMI_UI_DEMO: '1',
        VERCEL_ENV: 'preview',
        NODE_ENV: 'production',
      }),
    ).toBe(true)
  })

  it('forces demo off in production even with the flag', () => {
    expect(isUiDemo({ NAMI_UI_DEMO: '1', NODE_ENV: 'production' })).toBe(false)
    expect(
      isUiDemo({
        NAMI_UI_DEMO: '1',
        VERCEL_ENV: 'production',
        NODE_ENV: 'development',
      }),
    ).toBe(false)
    expect(
      isUiDemo({
        NAMI_UI_DEMO: '1',
        VERCEL_ENV: 'production',
        NODE_ENV: 'production',
      }),
    ).toBe(false)

    expect(errorLog).toHaveBeenCalledTimes(1)
    expect(String(errorLog.mock.calls[0]?.[0])).toContain('NAMI_UI_DEMO=1 was ignored')
  })

  it('ignores the role cookie unless demo mode is actually on', async () => {
    cookieJar.set(UI_DEMO_COOKIE, UserRole.ADMIN)

    assignEnv('NAMI_UI_DEMO', undefined)
    assignEnv('NODE_ENV', 'development')
    assignEnv('VERCEL_ENV', undefined)
    expect(await getDemoRole()).toBeNull()

    assignEnv('NAMI_UI_DEMO', '1')
    assignEnv('NODE_ENV', 'development')
    expect(await getDemoRole()).toBe(UserRole.ADMIN)

    cookieJar.delete(UI_DEMO_COOKIE)
    expect(await getDemoRole()).toBe(UserRole.STUDENT)

    cookieJar.set(UI_DEMO_COOKIE, UserRole.ADMIN)
    assignEnv('NAMI_UI_DEMO', '1')
    assignEnv('NODE_ENV', 'production')
    assignEnv('VERCEL_ENV', undefined)
    expect(await getDemoRole()).toBeNull()

    assignEnv('VERCEL_ENV', 'production')
    assignEnv('NODE_ENV', 'development')
    expect(await getDemoRole()).toBeNull()
  })

  it('does not impersonate from requireUser in production even with the flag and cookie', async () => {
    cookieJar.set(UI_DEMO_COOKIE, UserRole.ADMIN)
    assignEnv('NAMI_UI_DEMO', '1')
    assignEnv('NODE_ENV', 'production')
    assignEnv('VERCEL_ENV', 'production')
    assignEnv('NEXT_PUBLIC_SUPABASE_URL', undefined)
    assignEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined)
    assignEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', undefined)

    await expect(requireUser()).rejects.toThrow(
      'requireUser called without Supabase env',
    )
  })

  it('impersonates the cookie role from requireUser in development', async () => {
    cookieJar.set(UI_DEMO_COOKIE, UserRole.PROFESSOR)
    assignEnv('NAMI_UI_DEMO', '1')
    assignEnv('NODE_ENV', 'development')
    assignEnv('VERCEL_ENV', undefined)

    const auth = await requireUser()
    expect(auth.user.id).toBe(DEMO_IDS.professor)
    expect(auth.profile.role).toBe(UserRole.PROFESSOR)
  })

  it('returns fake service-role credentials only when demo mode is allowed', () => {
    expect(
      getServiceRoleEnv({
        NAMI_UI_DEMO: '1',
        NODE_ENV: 'development',
      }),
    ).toEqual({ url: 'https://demo.local', serviceRoleKey: 'demo' })

    expect(
      getServiceRoleEnv({
        NAMI_UI_DEMO: '1',
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'secret',
    })

    expect(
      getServiceRoleEnv({
        NAMI_UI_DEMO: '1',
        VERCEL_ENV: 'production',
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'secret',
    })

    expect(
      getServiceRoleEnv({
        NAMI_UI_DEMO: '1',
        NODE_ENV: 'production',
      }),
    ).toBeNull()
  })
})
