import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EnrollmentButton } from '@/components/courses/EnrollmentButton'
import { requireRole } from '@/lib/auth/require-role'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

type CourseRow = {
  id: string
  name: string
  year: number
  semester: number
  credit: number
  professor: { name: string | null } | { name: string | null }[] | null
}

export default async function EnrollPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('courseEnrollment')
  let courses: CourseRow[] = []
  let existingCourseIds: string[] = []
  let loadError: string | null = null

  if (isSupabaseConfigured()) {
    const { user } = await requireRole([UserRole.STUDENT])
    const supabase = await createClient()
    const [courseResult, enrollmentResult] = await Promise.all([
      supabase
        .from('courses')
        .select('id, name, year, semester, credit, professor:profiles!courses_professor_id_fkey(name)')
        .order('year', { ascending: false })
        .order('semester', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', user.id),
    ])

    courses = (courseResult.data ?? []) as CourseRow[]
    existingCourseIds = (enrollmentResult.data ?? []).map((item) => item.course_id)
    loadError = courseResult.error?.message ?? enrollmentResult.error?.message ?? null
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
                <th>{t('fields.professor')}</th>
                <th>{t('fields.term')}</th>
                <th>{t('fields.credit')}</th>
                <th>{t('fields.action')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const professor = Array.isArray(course.professor)
                  ? course.professor[0] ?? null
                  : course.professor
                return (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{professor?.name || t('unnamedProfessor')}</td>
                    <td>{t('term', { year: course.year, semester: course.semester })}</td>
                    <td>{course.credit}</td>
                    <td>
                      <EnrollmentButton
                        courseId={course.id}
                        enrolled={existingCourseIds.includes(course.id)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
