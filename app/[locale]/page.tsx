import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LocaleRootPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  let user = null
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user
  }

  redirect({ href: user ? '/home' : '/login', locale })
}
