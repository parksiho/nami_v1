import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isUiDemo } from '@/lib/supabase/env'
import { createDemoServerClient } from '@/lib/demo/supabase'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function createClient() {
  if (isUiDemo()) {
    return createDemoServerClient() as unknown as ReturnType<typeof createServerClient>
  }

  const env = getSupabaseEnv()

  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always set cookies; middleware refreshes sessions.
        }
      },
    },
  })
}
