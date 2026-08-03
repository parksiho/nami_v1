import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CreateAdminUserForm } from '@/components/admin/AdminUserForms'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Link } from '@/i18n/navigation'
import {
  ADMIN_ACADEMIC_FILTERS,
  buildStudentAcademicMap,
  collectAdmissionYears,
  filterStudentIdsByAcademic,
  type StudentAcademicInfo,
} from '@/lib/admin/user-academic'
import {
  ADMIN_USER_ROLE_FILTERS,
  ADMIN_USER_SORT,
  buildAdminUserListQuery,
  getAdminUserListParams,
  getServiceRoleEnv,
} from '@/lib/admin/users'
import { UserRole } from '@/lib/domain/enums'
import type { Profile } from '@/lib/domain/profile'
import { getAvatarPublicUrl } from '@/lib/profile/avatar'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string
    role?: string
    academicStatus?: string
    admissionYear?: string
  }>
}

export default async function AdminUsersPage({ params, searchParams }: Props) {
  const { locale } = await params
  const queryParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('adminUsers')
  const tEnrollment = await getTranslations('enrollment')
  const list = getAdminUserListParams(queryParams)
  let profiles: Profile[] = []
  let count = 0
  let loadError: string | null = null
  let avatarUrls = new Map<string, string | null>()
  let academicByUser = new Map<string, StudentAcademicInfo>()
  let admissionYears: number[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const [studentResult, enrollmentResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, student_number')
        .eq('role', UserRole.STUDENT),
      supabase
        .from('enrollment_records')
        .select('student_id, year, semester, status'),
    ])
    loadError =
      studentResult.error?.message ?? enrollmentResult.error?.message ?? null
    if (!loadError) {
      academicByUser = buildStudentAcademicMap(
        (studentResult.data ?? []) as { id: string; student_number: string | null }[],
        (enrollmentResult.data ?? []) as {
          student_id: string
          year: number
          semester: number
          status: string
        }[],
      )
      admissionYears = collectAdmissionYears(academicByUser)
    }

    let constrainedIds: string[] | null = null
    if (!loadError && (list.academicStatus || list.admissionYear !== null)) {
      constrainedIds = filterStudentIdsByAcademic(academicByUser, {
        academicStatus: list.academicStatus,
        admissionYear: list.admissionYear,
      })
    }

    if (!loadError) {
      const academicOnlyStudents = constrainedIds !== null
      const incompatibleRole =
        academicOnlyStudents && list.role && list.role !== UserRole.STUDENT

      if (incompatibleRole || (constrainedIds && constrainedIds.length === 0)) {
        profiles = []
        count = 0
      } else {
        let request = supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('updated_at', { ascending: list.ascending, nullsFirst: false })
          .range(list.from, list.to)

        if (list.query) request = request.ilike('name', `%${list.query}%`)
        if (list.role) {
          request = request.eq('role', list.role)
        } else if (academicOnlyStudents) {
          request = request.eq('role', UserRole.STUDENT)
        }
        if (constrainedIds) request = request.in('id', constrainedIds)

        const { data, count: total, error } = await request
        profiles = (data ?? []) as Profile[]
        count = total ?? 0
        loadError = error?.message ?? null
      }

      if (!loadError) {
        avatarUrls = new Map(
          profiles.map((profile) => [
            profile.id,
            getAvatarPublicUrl(supabase, profile.avatar_path),
          ]),
        )
      }
    }
  }

  const pageCount = Math.max(1, Math.ceil(count / list.pageSize))
  const searchHref = (page: number) => ({
    pathname: '/admin/users' as const,
    query: buildAdminUserListQuery(list, page),
  })

  return (
    <main className="page-main admin-users">
      <header className="admin-users__header">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
      </header>

      <form className="admin-user-filters">
        <label>
          <span>{t('filters.name')}</span>
          <input
            name="q"
            defaultValue={list.query}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label>
          <span>{t('filters.role')}</span>
          <select name="role" defaultValue={list.role}>
            <option value="">{t('filters.anyRole')}</option>
            {ADMIN_USER_ROLE_FILTERS.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('filters.admissionYear')}</span>
          <select
            name="admissionYear"
            defaultValue={list.admissionYear ? String(list.admissionYear) : ''}
          >
            <option value="">{t('filters.anyAdmissionYear')}</option>
            {admissionYears.map((year) => (
              <option key={year} value={year}>
                {t('filters.admissionYearOption', { year })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('filters.academicStatus')}</span>
          <select name="academicStatus" defaultValue={list.academicStatus}>
            <option value="">{t('filters.anyAcademicStatus')}</option>
            {ADMIN_ACADEMIC_FILTERS.map((status) => (
              <option key={status} value={status}>
                {tEnrollment(`statuses.${status}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('sortLabel')}</span>
          <select name="sort" defaultValue={list.sort}>
            <option value={ADMIN_USER_SORT.UPDATED_DESC}>
              {t('sort.updated_desc')}
            </option>
            <option value={ADMIN_USER_SORT.UPDATED_ASC}>
              {t('sort.updated_asc')}
            </option>
          </select>
        </label>
        <div className="admin-user-filters__actions">
          <button type="submit" className="admin-button">
            {t('search')}
          </button>
          {list.hasFilters || list.sort !== ADMIN_USER_SORT.UPDATED_DESC ? (
            <Link href="/admin/users" className="admin-filter-clear">
              {t('filters.clear')}
            </Link>
          ) : null}
        </div>
      </form>

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
                  <th>{t('fields.admissionYear')}</th>
                  <th>{t('fields.academicStatus')}</th>
                  <th>{t('fields.status')}</th>
                  <th>{t('fields.updatedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length ? profiles.map((profile) => {
                  const academic = academicByUser.get(profile.id)
                  return (
                    <tr key={profile.id}>
                      <td>
                        <ProfileAvatar
                          name={profile.name}
                          avatarUrl={avatarUrls.get(profile.id)}
                          size="sm"
                        />
                      </td>
                      <td>
                        <Link href={`/admin/users/${profile.id}`}>
                          {profile.name || t('unnamed')}
                        </Link>
                      </td>
                      <td>{profile.email || '—'}</td>
                      <td>{t(`roles.${profile.role}`)}</td>
                      <td>
                        {academic?.admissionYear
                          ? t('filters.admissionYearOption', {
                              year: academic.admissionYear,
                            })
                          : '—'}
                      </td>
                      <td>
                        {academic?.academicStatus
                          ? tEnrollment(`statuses.${academic.academicStatus}`)
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={
                            profile.is_active === false
                              ? 'admin-status admin-status--inactive'
                              : 'admin-status admin-status--active'
                          }
                        >
                          {profile.is_active === false
                            ? t('status.inactive')
                            : t('status.active')}
                        </span>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat(locale).format(
                          new Date(profile.updated_at),
                        )}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={8}>{t('noUsers')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <nav className="admin-pagination" aria-label={t('pagination')}>
            {list.page > 1 ? (
              <Link href={searchHref(list.page - 1)}>{t('previous')}</Link>
            ) : (
              <span />
            )}
            <span>{t('pageOf', { page: list.page, pages: pageCount })}</span>
            {list.page < pageCount ? (
              <Link href={searchHref(list.page + 1)}>{t('next')}</Link>
            ) : (
              <span />
            )}
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
