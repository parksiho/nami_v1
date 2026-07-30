import { forbidden } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { requireRole } from '@/lib/auth/require-role'
import type { AcademicStatus } from '@/lib/domain/enums'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { assertProfessorOwnsStudent } from '@/lib/teaching/grades'

type Props = {
  params: Promise<{ locale: string; studentId: string }>
}

type EnrollmentRecord = {
  id: string
  grade_year: number | null
  year: number
  semester: number
  status: AcademicStatus
  entrance_info: string | null
  graduate_info: string | null
  change_reason: string | null
  leave_start: string | null
  leave_end: string | null
}

export default async function TeachingStudentPage({ params }: Props) {
  const { locale, studentId } = await params
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
  const ownershipResult = await supabase
    .from('student_courses')
    .select('student_id, course:courses!inner(professor_id)')
    .eq('course.professor_id', user.id)

  if (ownershipResult.error) {
    return (
      <main className="page-main course-page">
        <Link href="/teaching" className="admin-back">{t('backToList')}</Link>
        <p className="admin-message admin-message--error" role="alert">
          {ownershipResult.error.message}
        </p>
      </main>
    )
  }

  try {
    assertProfessorOwnsStudent(
      (ownershipResult.data ?? []).map((row) => row.student_id),
      studentId,
    )
  } catch {
    forbidden()
  }

  const [studentResult, recordsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', studentId)
      .maybeSingle(),
    supabase
      .from('enrollment_records')
      .select(`
        id,
        grade_year,
        year,
        semester,
        status,
        entrance_info,
        graduate_info,
        change_reason,
        leave_start,
        leave_end
      `)
      .eq('student_id', studentId)
      .order('year', { ascending: false })
      .order('semester', { ascending: false }),
  ])
  const loadError = studentResult.error?.message ?? recordsResult.error?.message
  const records = (recordsResult.data ?? []) as EnrollmentRecord[]

  return (
    <main className="page-main course-page">
      <Link href="/teaching" className="admin-back">{t('backToList')}</Link>
      <header className="course-page__header">
        <h1>{studentResult.data?.name || t('unnamedStudent')}</h1>
        <p>{studentResult.data?.email || t('academicRecordDescription')}</p>
      </header>
      <h2 className="teaching-section-title">{t('academicRecordTitle')}</h2>
      {loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : records.length === 0 ? (
        <p className="admin-notice">{t('noAcademicRecords')}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('fields.term')}</th>
                <th>{t('fields.gradeYear')}</th>
                <th>{t('fields.academicStatus')}</th>
                <th>{t('fields.details')}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{t('term', { year: record.year, semester: record.semester })}</td>
                  <td>{record.grade_year ?? t('notAvailable')}</td>
                  <td>{t(`academicStatuses.${record.status}`)}</td>
                  <td>
                    {[
                      record.entrance_info,
                      record.graduate_info,
                      record.change_reason,
                      record.leave_start && record.leave_end
                        ? t('leavePeriod', {
                            start: record.leave_start,
                            end: record.leave_end,
                          })
                        : null,
                    ].filter(Boolean).join(' · ') || t('notAvailable')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
