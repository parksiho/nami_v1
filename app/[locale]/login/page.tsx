import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')

  return (
    <main className="page-main auth-page">
      <AuthCard
        title={t('login')}
        footer={
          <>
            {t('noAccount')}{' '}
            <Link href="/register">{t('register')}</Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </main>
  )
}
