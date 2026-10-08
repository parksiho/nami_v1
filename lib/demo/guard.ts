/**
 * Single switch for UI demo mode (`NAMI_UI_DEMO=1`).
 *
 * Screenshot capture runs `NAMI_UI_DEMO=1 npm run dev`, which is
 * NODE_ENV=development and has no VERCEL_ENV. Vercel Preview deployments
 * also need the flag: they run with NODE_ENV=production and
 * VERCEL_ENV=preview. Vercel sets VERCEL_ENV itself and project env vars
 * cannot override it, so a production deployment cannot claim to be preview.
 *
 * Anywhere else, NODE_ENV=production (including `next start`) is production.
 * The flag is ignored there and an error is logged once; callers keep using
 * real auth instead of throwing, so a mis-set variable cannot take the site down.
 */
export type DemoRuntimeEnv = Record<string, string | undefined>

let loggedBlockedDemo = false

export function resetDemoGuardForTests(): void {
  loggedBlockedDemo = false
}

export function isProductionRuntime(env: DemoRuntimeEnv = process.env): boolean {
  if (env.VERCEL_ENV === 'production') return true
  if (env.VERCEL_ENV === 'preview') return false
  return env.NODE_ENV === 'production'
}

export function isUiDemo(env: DemoRuntimeEnv = process.env): boolean {
  if (env.NAMI_UI_DEMO !== '1') return false
  if (!isProductionRuntime(env)) return true

  if (!loggedBlockedDemo) {
    loggedBlockedDemo = true
    console.error(
      '[nami] NAMI_UI_DEMO=1 was ignored. Demo mode cannot run when VERCEL_ENV is production, or when NODE_ENV is production outside a Vercel preview deployment.',
    )
  }
  return false
}
