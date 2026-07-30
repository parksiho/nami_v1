import { forbidden } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ScoreEditor } from '@/components/grades/ScoreEditor'
import { Link } from '@/i18n/navigation'
import { requireRole } from '@/lib/auth/require-role'
import type { CourseEnrollmentStatus } from '@/lib/domain/enums'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string; courseId: string }>
}

type StudentCourseRow = {
  id: string
  student_id: string
  enrollment_status: CourseEnrollmentStatus
  score: number | null
  pass: boolean | null
  student: {
    id: string
    name: string | null
    email: string | null
  } | {
    id: string
    name: string | null
    email: string | null
  }[] | null
}

export default async function TeachingCoursePage({ params }: Props) {
  const { locale, courseId } = await params
  setRequestLocale(locale)
  const t = await getTranslations('teaching')

  if (!isSupabaseConfigured()) {
    return (
      <main className="page-main course-page">
        <Link href="/teaching" className="admin-back">{t('backToList')}</Link>
        <p className="admin-notice">{t('notConfigured')}</p>
      </main>
    )
  }

  const { user } = await requireRole([UserRole.PROFESSOR])
  const supabase = await createClient()
  const courseResult = await supabase
    .from('courses')
    .select('id, name, year, semester, credit')
    .eq('id', courseId)
    .eq('professor_id', user.id)
    .maybeSingle()

  if (courseResult.error) {
    return (
      <main className="page-main course-page">
        <Link href="/teaching" className="admin-back">{t('backToList')}</Link>
        <p className="admin-message admin-message--error" role="alert">
          {courseResult.error.message}
        </p>
      </main>
    )
  }
  if (!courseResult.data) forbidden()

  const enrollmentsResult = await supabase
    .from('student_courses')
    .select(`
      id,
      student_id,
      enrollment_status,
      score,
      pass,
      student:profiles!student_courses_student_id_fkey(id, name, email)
    `)
    .eq('course_id', courseId)
    .order('created_at')
  const enrollments = (enrollmentsResult.data ?? []) as StudentCourseRow[]

  return (
    <main className="page-main course-page">
      <Link href="/teaching" className="admin-back">{t('backToList')}</Link>
      <header className="course-page__header">
        <h1>{courseResult.data.name}</h1>
        <p>
          {t('courseSummary', {
            year: courseResult.data.year,
            semester: courseResult.data.semester,
            credit: courseResult.data.credit,
          })}
        </p>
      </header>
      {enrollmentsResult.error ? (
        <p className="admin-message admin-message--error" role="alert">
          {enrollmentsResult.error.message}
        </p>
      ) : enrollments.length === 0 ? (
        <p className="admin-notice">{t('noStudents')}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table teaching-students">
            <thead>
              <tr>
                <th>{t('fields.student')}</th>
                <th>{t('fields.email')}</th>
                <th>{t('fields.gradeEntry')}</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const student = Array.isArray(enrollment.student)
                  ? enrollment.student[0]
                  : enrollment.student
                return (
                  <tr key={enrollment.id}>
                    <td>
                      <Link href={`/teaching/students/${enrollment.student_id}`}>
                        {student?.name || t('unnamedStudent')}
                      </Link>
                    </td>
                    <td>{student?.email || t('notAvailable')}</td>
                    <td>
                      <ScoreEditor
                        enrollmentId={enrollment.id}
                        courseId={courseId}
                        score={enrollment.score}
                        pass={enrollment.pass}
                        status={enrollment.enrollment_status}
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
