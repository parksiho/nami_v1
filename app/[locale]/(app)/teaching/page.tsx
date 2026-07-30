import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

type TeachingCourse = {
  id: string
  name: string
  year: number
  semester: number
  credit: number
}

export default async function TeachingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('teaching')
  let courses: TeachingCourse[] = []
  let loadError: string | null = null

  if (isSupabaseConfigured()) {
    const { user } = await requireRole([UserRole.PROFESSOR])
    const supabase = await createClient()
    const result = await supabase
      .from('courses')
      .select('id, name, year, semester, credit')
      .eq('professor_id', user.id)
      .order('year', { ascending: false })
      .order('semester', { ascending: false })
      .order('name')

    courses = result.data ?? []
    loadError = result.error?.message ?? null
  }

  return (
    <main className="page-main course-page">
      <header className="course-page__header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      {!isSupabaseConfigured() ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : courses.length === 0 ? (
        <p className="admin-notice">{t('noCourses')}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('fields.course')}</th>
                <th>{t('fields.term')}</th>
                <th>{t('fields.credit')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td><Link href={`/teaching/${course.id}`}>{course.name}</Link></td>
                  <td>{t('term', { year: course.year, semester: course.semester })}</td>
                  <td>{course.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
