import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { AuthCard } from '@/components/auth/AuthCard'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function ChangePasswordPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  if (isSupabaseConfigured()) {
    await requireUser()
  }

  const t = await getTranslations('auth')

  return (
    <main className="page-main auth-page">
      <AuthCard
        title={t('changePassword')}
        footer={
          <Link href="/home">{t('backToHome')}</Link>
        }
      >
        <ChangePasswordForm />
      </AuthCard>
    </main>
  )
}
