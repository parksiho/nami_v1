import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const tAuth = await getTranslations({ locale, namespace: 'auth' })
  const tApp = await getTranslations({ locale, namespace: 'app' })
  return {
    title: `${tAuth('login')} · ${tApp('siteTitle')}`,
  }
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  const tApp = await getTranslations('app')
  const tLegal = await getTranslations('legal')

  return (
    <main className="page-main auth-page">
      <AuthCard
        brand={tApp('siteTitle')}
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
