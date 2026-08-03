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
  const tLegal = await getTranslations('legal')

  return (
    <main className="page-main auth-page">
      <AuthCard
        title={t('login')}
        footer={
          <>
            <p>
              {t('noAccount')}{' '}
              <Link href="/register">{t('register')}</Link>
            </p>
            <p className="auth-links__legal">
              <Link href="/privacy">{tLegal('privacyLink')}</Link>
            </p>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </main>
  )
}
