import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AdminUserAccountControls } from '@/components/admin/AdminUserAccountControls'
import { EditAdminUserForm } from '@/components/admin/AdminUserForms'
import { AdminEnrollmentForm } from '@/components/courses/AdminEnrollmentForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Link } from '@/i18n/navigation'
import { uploadAdminAvatar } from '@/app/[locale]/(app)/admin/users/actions'
import { requireRole } from '@/lib/auth/require-role'
import { UserRole } from '@/lib/domain/enums'
import type { Profile } from '@/lib/domain/profile'
import { getAvatarPublicUrl } from '@/lib/profile/avatar'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('adminUsers')

  if (!isSupabaseConfigured()) {
    return (
      <main className="page-main admin-users">
        <Link href="/admin/users" className="admin-back">{t('backToList')}</Link>
        <p className="admin-notice">{t('notConfigured')}</p>
      </main>
    )
  }

  const [{ user: actor }, supabase] = await Promise.all([
    requireRole([UserRole.ADMIN]),
    createClient(),
  ])
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <main className="page-main admin-users">
        <Link href="/admin/users" className="admin-back">{t('backToList')}</Link>
        <p className="admin-message admin-message--error" role="alert">{error.message}</p>
      </main>
    )
  }
  if (!data) notFound()

  const profile = data as Profile
  const avatarUrl = getAvatarPublicUrl(supabase, profile.avatar_path)
  const canUploadAvatar =
    profile.role === UserRole.STUDENT || profile.role === UserRole.PROFESSOR
  let courses: { id: string; name: string; year: number; semester: number }[] = []
  let existingCourseIds: string[] = []
  let enrollmentLoadError: string | null = null

  if (profile.role === UserRole.STUDENT) {
    const [courseResult, enrollmentResult] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, year, semester')
        .order('year', { ascending: false })
        .order('semester', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', profile.id),
    ])
    courses = courseResult.data ?? []
    existingCourseIds = (enrollmentResult.data ?? []).map((item) => item.course_id)
    enrollmentLoadError = courseResult.error?.message ?? enrollmentResult.error?.message ?? null
  }

  return (
    <main className="page-main admin-users">
      <Link href="/admin/users" className="admin-back">{t('backToList')}</Link>
      <header className="admin-users__header admin-users__header--detail">
        <div>
          <h1>{profile.name || t('unnamed')}</h1>
          <p>{profile.email || profile.id}</p>
          <p>
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
          </p>
        </div>
      </header>
      {canUploadAvatar ? (
        <section className="admin-card">
          <AvatarUpload
            avatarUrl={avatarUrl}
            name={profile.name}
            action={uploadAdminAvatar.bind(null, profile.id)}
            title={t('avatar.title')}
            help={t('avatar.help')}
            uploadLabel={t('avatar.upload')}
            uploadingLabel={t('avatar.uploading')}
          />
        </section>
      ) : null}
      {profile.role === UserRole.STUDENT || profile.role === UserRole.PROFESSOR ? (
        <section className="admin-card admin-context-links">
          <h2>{t('contextLinks.title')}</h2>
          <ul className="admin-context-links__list">
            {profile.role === UserRole.STUDENT ? (
              <li>
                <Link
                  href={{
                    pathname: '/admin/enrollments',
                    query: { studentId: profile.id },
                  }}
                >
                  {t('contextLinks.studentEnrollments')}
                </Link>
                <p className="admin-context-links__hint">
                  {t('contextLinks.studentEnrollmentsHint', { studentId: profile.id })}
                </p>
              </li>
            ) : null}
            {profile.role === UserRole.PROFESSOR ? (
              <li>
                <Link
                  href={{
                    pathname: '/admin/courses',
                    query: { professorId: profile.id },
                  }}
                >
                  {t('contextLinks.professorCourses')}
                </Link>
                <p className="admin-context-links__hint">
                  {t('contextLinks.professorCoursesHint', { professorId: profile.id })}
                </p>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
      <section className="admin-card">
        <EditAdminUserForm profile={profile} />
      </section>
      <AdminUserAccountControls
        userId={profile.id}
        isActive={profile.is_active !== false}
        canManage={profile.id !== actor.id}
      />
      {profile.role === UserRole.STUDENT ? (
        <section className="admin-card">
          <h2>{t('proxyEnroll.title')}</h2>
          <p>{t('proxyEnroll.description')}</p>
          {enrollmentLoadError ? (
            <p className="admin-message admin-message--error" role="alert">{enrollmentLoadError}</p>
          ) : (
            <AdminEnrollmentForm
              studentId={profile.id}
              courses={courses}
              existingCourseIds={existingCourseIds}
            />
          )}
        </section>
      ) : null}
    </main>
  )
}
