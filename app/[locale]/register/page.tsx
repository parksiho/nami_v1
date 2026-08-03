import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const tAuth = await getTranslations({ locale, namespace: 'auth' })
  const tApp = await getTranslations({ locale, namespace: 'app' })
  return {
    title: `${tAuth('register')} · ${tApp('siteTitle')}`,
  }
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth')
  const tApp = await getTranslations('app')
  const tLegal = await getTranslations('legal')

  return (
    <main className="page-main auth-page">
      <AuthCard
        brand={tApp('siteTitle')}
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
