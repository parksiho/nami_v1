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

  return (
    <main className="page-main auth-page">
      <AuthCard
        title={t('register')}
        footer={
          <>
            {t('hasAccount')}{' '}
            <Link href="/login">{t('login')}</Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </main>
  )
}
