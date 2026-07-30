import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('nav')

  return (
    <main className="page-main">
      <h1>{t('home')}</h1>
      <p>Protected app route — login UI in Task 5.</p>
    </main>
  )
}
