import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { NoticeForm, type EditableNotice } from '@/components/notices/NoticeForm'
import { Link } from '@/i18n/navigation'
import { requireUser } from '@/lib/auth/require-user'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ locale: string; id: string }> }

type NoticeDetail = EditableNotice & {
  created_at: string
  updated_at: string
}

export default async function NoticeDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('notices')

  if (!isSupabaseConfigured()) {
    return (
      <main className="page-main notices-page">
        <Link href="/notices" className="admin-back">{t('backToList')}</Link>
        <p className="admin-notice">{t('notConfigured')}</p>
      </main>
    )
  }

  const [{ profile }, result] = await Promise.all([
    requireUser(),
    (await createClient()).from('notices').select('*').eq('id', id).maybeSingle(),
  ])
  if (result.error) {
    return (
      <main className="page-main notices-page">
        <Link href="/notices" className="admin-back">{t('backToList')}</Link>
        <p className="admin-message admin-message--error" role="alert">{result.error.message}</p>
      </main>
    )
  }
  if (!result.data) notFound()
  const notice = result.data as NoticeDetail

  return (
    <main className="page-main notices-page">
      <Link href="/notices" className="admin-back">{t('backToList')}</Link>
      <article className="notice-detail">
        <h1>{notice.title}</h1>
        <time dateTime={notice.created_at}>
          {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(notice.created_at))}
        </time>
        <div className="notice-detail__body">{notice.body}</div>
      </article>
      {profile.role === UserRole.ADMIN ? (
        <section className="admin-create">
          <h2>{t('editTitle')}</h2>
          <NoticeForm notice={notice} />
        </section>
      ) : null}
    </main>
  )
}
