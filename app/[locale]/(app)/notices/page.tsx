import { getTranslations, setRequestLocale } from 'next-intl/server'
import { NoticeForm } from '@/components/notices/NoticeForm'
import { Link } from '@/i18n/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ locale: string }> }

type NoticeListItem = {
  id: string
  title: string
  created_at: string
}

export default async function NoticesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('notices')
  const configured = isSupabaseConfigured()
  const profile = configured
    ? (await requireUser()).profile
    : { role: UserRole.STUDENT }
  let notices: NoticeListItem[] = []
  let loadError: string | null = null

  if (configured) {
    const result = await (await createClient())
      .from('notices')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
    notices = result.data ?? []
    loadError = result.error?.message ?? null
  }

  return (
    <main className="page-main notices-page">
      <header className="course-page__header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      {!configured ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : notices.length === 0 ? (
        <p className="admin-notice">{t('empty')}</p>
      ) : (
        <ul className="notice-list">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link href={`/notices/${notice.id}`} className="notice-list__link">
                <strong>{notice.title}</strong>
                <time dateTime={notice.created_at}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(notice.created_at))}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {profile.role === UserRole.ADMIN ? (
        <section className="admin-create">
          <h2>{t('createTitle')}</h2>
          <NoticeForm />
        </section>
      ) : null}
    </main>
  )
}
