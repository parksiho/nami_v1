import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CourseStatusBadge } from '@/components/courses/CourseStatusBadge'
import { requireRole } from '@/lib/auth/require-role'
import {
  type CourseEnrollmentStatus,
  UserRole,
} from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
}

type GradeRow = {
  id: string
  enrollment_status: CourseEnrollmentStatus
  score: number | null
  pass: boolean | null
  course: {
    name: string
    year: number
    semester: number
    credit: number
  } | {
    name: string
    year: number
    semester: number
    credit: number
  }[] | null
}

export default async function GradesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('courseEnrollment')
  let grades: GradeRow[] = []
  let loadError: string | null = null

  if (isSupabaseConfigured()) {
    const { user } = await requireRole([UserRole.STUDENT])
    const supabase = await createClient()
    const result = await supabase
      .from('student_courses')
      .select('id, enrollment_status, score, pass, course:courses(name, year, semester, credit)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    grades = (result.data ?? []) as GradeRow[]
    loadError = result.error?.message ?? null
  }

  return (
    <main className="page-main course-page">
      <header className="course-page__header">
        <h1>{t('gradesTitle')}</h1>
        <p>{t('gradesDescription')}</p>
      </header>
      {!isSupabaseConfigured() ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : grades.length === 0 ? (
        <p className="admin-notice">{t('noGrades')}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('fields.course')}</th>
                <th>{t('fields.term')}</th>
                <th>{t('fields.credit')}</th>
                <th>{t('fields.status')}</th>
                <th>{t('fields.score')}</th>
                <th>{t('fields.pass')}</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => {
                const course = Array.isArray(grade.course) ? grade.course[0] : grade.course
                if (!course) return null
                return (
                  <tr key={grade.id}>
                    <td>{course.name}</td>
                    <td>{t('term', { year: course.year, semester: course.semester })}</td>
                    <td>{course.credit}</td>
                    <td><CourseStatusBadge status={grade.enrollment_status} /></td>
                    <td>{grade.score ?? t('notAvailable')}</td>
                    <td>{grade.pass ? t('passed') : t('notPassed')}</td>
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
