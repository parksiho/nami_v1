import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  const tLegal = await getTranslations('legal')

  return (
    <main className="page-main auth-page">
      <AuthCard
        title={t('register')}
        footer={
          <>
            <p>
              {t('hasAccount')}{' '}
              <Link href="/login">{t('login')}</Link>
            </p>
            <p className="auth-links__legal">
              <Link href="/privacy">{tLegal('privacyLink')}</Link>
            </p>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </main>
  )
}
