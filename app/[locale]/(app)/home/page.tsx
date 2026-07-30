import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { Link } from '@/i18n/navigation'
import { UserRole } from '@/lib/domain/enums'
import { buildHomeModel, countPendingGrades } from '@/lib/home/build-home-model'
import { requireUser } from '@/lib/auth/require-user'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const configured = isSupabaseConfigured()
  const profile = configured
    ? (await requireUser()).profile
    : { id: 'demo', name: 'Demo Student', role: UserRole.STUDENT }

  const t = await getTranslations('home')
  const tNav = await getTranslations('nav')
  const { welcomeKey, shortcuts } = buildHomeModel(profile.role)
  let notices: { id: string; title: string; created_at: string }[] = []
  let studentStatus: string | null = null
  let studentCourseCount = 0
  let professorCourseCount = 0
  let pendingGradeCount = 0
  let adminCounts = { users: 0, courses: 0, enrollments: 0 }
  let recentChanges: { id: string; summary: string | null; action: string; created_at: string }[] = []
  let loadError: string | null = null

  if (configured) {
    const supabase = await createClient()
    const noticeResult = await supabase
      .from('notices')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
    notices = noticeResult.data ?? []
    loadError = noticeResult.error?.message ?? null

    if (profile.role === UserRole.STUDENT) {
      const [recordResult, coursesResult] = await Promise.all([
        supabase
          .from('enrollment_records')
          .select('status')
          .eq('student_id', profile.id)
          .order('year', { ascending: false })
          .order('semester', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('student_courses')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', profile.id),
      ])
      studentStatus = recordResult.data?.status ?? null
      studentCourseCount = coursesResult.count ?? 0
      loadError ||= recordResult.error?.message ?? coursesResult.error?.message ?? null
    } else if (profile.role === UserRole.PROFESSOR) {
      const courseResult = await supabase.from('courses').select('id').eq('professor_id', profile.id)
      const courseIds = (courseResult.data ?? []).map((course) => course.id)
      professorCourseCount = courseIds.length
      if (courseIds.length) {
        const gradeResult = await supabase
          .from('student_courses')
          .select('score, enrollment_status')
          .in('course_id', courseIds)
        pendingGradeCount = countPendingGrades(gradeResult.data ?? [])
        loadError ||= gradeResult.error?.message ?? null
      }
      loadError ||= courseResult.error?.message ?? null
    } else {
      const [usersResult, coursesResult, enrollmentsResult, changesResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('enrollment_records').select('id', { count: 'exact', head: true }),
        supabase.from('change_logs').select('id, summary, action, created_at').order('created_at', { ascending: false }).limit(5),
      ])
      adminCounts = {
        users: usersResult.count ?? 0,
        courses: coursesResult.count ?? 0,
        enrollments: enrollmentsResult.count ?? 0,
      }
      recentChanges = changesResult.data ?? []
      loadError ||= usersResult.error?.message ?? coursesResult.error?.message ??
        enrollmentsResult.error?.message ?? changesResult.error?.message ?? null
    }
  }

  return (
    <main className="page-main home-page">
      <section className="home-hero">
        <h1 className="home-hero__title">
          {profile.name
            ? t(welcomeKey, { name: profile.name })
            : t('welcomeAnonymous')}
        </h1>
      </section>

      <section className="home-section">
        <h2 className="home-section__title">{t('summaryTitle')}</h2>
        {loadError ? (
          <p className="admin-message admin-message--error" role="alert">{loadError}</p>
        ) : profile.role === UserRole.STUDENT ? (
          <div className="home-summary-grid">
            <article className="home-stat">
              <span>{t('student.academicStatus')}</span>
              <strong>{studentStatus ? t(`academicStatuses.${studentStatus}`) : t('notAvailable')}</strong>
            </article>
            <article className="home-stat">
              <span>{t('student.courseCount')}</span>
              <strong>{studentCourseCount}</strong>
            </article>
            <Link className="admin-button" href="/enrollment">{t('student.cta')}</Link>
          </div>
        ) : profile.role === UserRole.PROFESSOR ? (
          <div className="home-summary-grid">
            <article className="home-stat">
              <span>{t('professor.courseCount')}</span>
              <strong>{professorCourseCount}</strong>
            </article>
            <article className="home-stat">
              <span>{t('professor.pendingGrades')}</span>
              <strong>{pendingGradeCount}</strong>
            </article>
            <Link className="admin-button" href="/teaching">{t('professor.cta')}</Link>
          </div>
        ) : (
          <div className="home-summary-grid">
            {(['users', 'courses', 'enrollments'] as const).map((key) => (
              <article className="home-stat" key={key}>
                <span>{t(`admin.${key}`)}</span>
                <strong>{adminCounts[key]}</strong>
              </article>
            ))}
            <Link className="admin-button" href="/admin/users">{t('admin.cta')}</Link>
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="home-section__title">{t('shortcuts')}</h2>
        <ul className="home-shortcuts">
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link className="home-shortcut" href={item.href}>
                {tNav(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section">
        <h2 className="home-section__title">{tNav('notices')}</h2>
        {notices.length ? (
          <ul className="home-feed">
            {notices.map((notice) => (
              <li key={notice.id}>
                <Link href={`/notices/${notice.id}`}>{notice.title}</Link>
                <time dateTime={notice.created_at}>
                  {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(notice.created_at))}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={t('emptyNotices')}
            action={<Link href="/notices">{t('viewNotices')}</Link>}
          />
        )}
      </section>

      {profile.role === UserRole.ADMIN ? (
        <section className="home-section">
          <h2 className="home-section__title">{tNav('changeLogs')}</h2>
          {recentChanges.length ? (
            <ul className="home-feed">
              {recentChanges.map((change) => (
                <li key={change.id}>
                  <span>{change.summary || change.action}</span>
                  <time dateTime={change.created_at}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(change.created_at))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('emptyChanges')} />
          )}
          <Link href="/admin/change-logs">{t('viewChanges')}</Link>
        </section>
      ) : null}
    </main>
  )
}
