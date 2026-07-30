import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { getChangeLogListParams } from '@/lib/changelog/list'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}

type ChangeLog = {
  id: string
  action: string
  target_type: string
  summary: string | null
  created_at: string
  actor: { name: string | null } | { name: string | null }[] | null
}

export default async function ChangeLogsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const query = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('changeLogs')
  const list = getChangeLogListParams(query)
  let logs: ChangeLog[] = []
  let count = 0
  let loadError: string | null = null

  if (isSupabaseConfigured()) {
    await requireRole([UserRole.ADMIN])
    const result = await (await createClient())
      .from('change_logs')
      .select('id, action, target_type, summary, created_at, actor:profiles!change_logs_actor_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(list.from, list.to)
    logs = (result.data ?? []) as ChangeLog[]
    count = result.count ?? 0
    loadError = result.error?.message ?? null
  }

  const pages = Math.max(1, Math.ceil(count / list.pageSize))
  return (
    <main className="page-main admin-users">
      <header className="admin-users__header">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
      </header>
      {!isSupabaseConfigured() ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : logs.length === 0 ? (
        <p className="admin-notice">{t('empty')}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('fields.when')}</th>
                <th>{t('fields.actor')}</th>
                <th>{t('fields.action')}</th>
                <th>{t('fields.target')}</th>
                <th>{t('fields.summary')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actor = Array.isArray(log.actor) ? log.actor[0] : log.actor
                return (
                  <tr key={log.id}>
                    <td><time dateTime={log.created_at}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.created_at))}</time></td>
                    <td>{actor?.name || t('unknownActor')}</td>
                    <td><code>{log.action}</code></td>
                    <td>{log.target_type}</td>
                    <td>{log.summary || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <nav className="admin-pagination" aria-label={t('pagination')}>
        {list.page > 1 ? <Link href={{ pathname: '/admin/change-logs', query: { page: list.page - 1 } }}>{t('previous')}</Link> : <span />}
        <span>{t('pageOf', { page: list.page, pages })}</span>
        {list.page < pages ? <Link href={{ pathname: '/admin/change-logs', query: { page: list.page + 1 } }}>{t('next')}</Link> : <span />}
      </nav>
    </main>
  )
}
