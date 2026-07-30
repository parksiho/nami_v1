import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const env = getSupabaseEnv()

  if (!env) {
    return response
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Prefer getSession() for speed: reads/refreshes cookies without an Auth
  // server round-trip on every navigation. Sensitive routes/actions call
  // getUser() via requireUser({ verify: true }) / requireRole().
  await supabase.auth.getSession()

  return response
}
