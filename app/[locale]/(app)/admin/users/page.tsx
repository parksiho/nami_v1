import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CreateAdminUserForm } from '@/components/admin/AdminUserForms'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Link } from '@/i18n/navigation'
import { getAdminUserListParams, getServiceRoleEnv } from '@/lib/admin/users'
import type { Profile } from '@/lib/domain/profile'
import { getAvatarPublicUrl } from '@/lib/profile/avatar'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params
  const queryParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('adminUsers')
  const list = getAdminUserListParams(queryParams)
  let profiles: Profile[] = []
  let count = 0
  let loadError: string | null = null
  let avatarUrls = new Map<string, string | null>()

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    let request = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true, nullsFirst: false })
      .range(list.from, list.to)

    if (list.query) request = request.ilike('name', `%${list.query}%`)

    const { data, count: total, error } = await request
    profiles = (data ?? []) as Profile[]
    count = total ?? 0
    loadError = error?.message ?? null
    avatarUrls = new Map(
      profiles.map((profile) => [
        profile.id,
        getAvatarPublicUrl(supabase, profile.avatar_path),
      ]),
    )
  }

  const pageCount = Math.max(1, Math.ceil(count / list.pageSize))
  const searchHref = (page: number) => ({
    pathname: '/admin/users' as const,
    query: { ...(list.query ? { q: list.query } : {}), page },
  })

  return (
    <main className="page-main admin-users">
      <header className="admin-users__header">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        <form className="admin-search">
          <input
            name="q"
            defaultValue={list.query}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          <button type="submit" className="admin-button">{t('search')}</button>
        </form>
      </header>

      {!isSupabaseConfigured() ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('fields.photo')}</th>
                  <th>{t('fields.name')}</th>
                  <th>{t('fields.email')}</th>
                  <th>{t('fields.role')}</th>
                  <th>{t('fields.updatedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length ? profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <ProfileAvatar
                        name={profile.name}
                        avatarUrl={avatarUrls.get(profile.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <Link href={`/admin/users/${profile.id}`}>{profile.name || t('unnamed')}</Link>
                    </td>
                    <td>{profile.email || '—'}</td>
                    <td>{t(`roles.${profile.role}`)}</td>
                    <td>{new Intl.DateTimeFormat(locale).format(new Date(profile.updated_at))}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}>{t('noUsers')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <nav className="admin-pagination" aria-label={t('pagination')}>
            {list.page > 1 ? <Link href={searchHref(list.page - 1)}>{t('previous')}</Link> : <span />}
            <span>{t('pageOf', { page: list.page, pages: pageCount })}</span>
            {list.page < pageCount ? <Link href={searchHref(list.page + 1)}>{t('next')}</Link> : <span />}
          </nav>
        </>
      )}

      <section className="admin-create">
        <h2>{t('createTitle')}</h2>
        {getServiceRoleEnv() ? (
          <CreateAdminUserForm />
        ) : (
          <p className="admin-notice">{t('createUnavailable')}</p>
        )}
      </section>
    </main>
  )
}
