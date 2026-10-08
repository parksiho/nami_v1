import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Opt out of static and ISR caching so every hit reaches Supabase.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const noStoreHeaders = { 'Cache-Control': 'no-store' }

function unavailable() {
  return NextResponse.json(
    { ok: false, error: 'database unavailable' },
    { status: 503, headers: noStoreHeaders },
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    // Existing table. Anon RLS may return no rows; the query still runs.
    const { error } = await supabase.from('courses').select('id').limit(1)

    if (error) {
      return unavailable()
    }

    return NextResponse.json(
      { ok: true, db: 'ok', time: new Date().toISOString() },
      { status: 200, headers: noStoreHeaders },
    )
  } catch {
    return unavailable()
  }
}
