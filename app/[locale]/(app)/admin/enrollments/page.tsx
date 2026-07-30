import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EnrollmentForm, type PersonOption } from '@/components/enrollment/EnrollmentForm'
import { EnrollmentTable, type EnrollmentListItem } from '@/components/enrollment/EnrollmentTable'
import { Link } from '@/i18n/navigation'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ studentId?: string }>
}

export default async function AdminEnrollmentsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { studentId = '' } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('enrollment')
  let records: EnrollmentListItem[] = []
  let students: PersonOption[] = []
  let professors: PersonOption[] = []
  let error: string | null = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    let request = supabase.from('enrollment_records')
      .select('id, grade_year, year, semester, status, student:profiles!enrollment_records_student_id_fkey(id, name)')
      .order('year', { ascending: false }).order('semester', { ascending: false })
    if (studentId) request = request.eq('student_id', studentId)
    const [recordResult, studentResult, professorResult] = await Promise.all([
      request,
      supabase.from('profiles').select('id, name').eq('role', UserRole.STUDENT).order('name'),
      supabase.from('profiles').select('id, name').eq('role', UserRole.PROFESSOR).order('name'),
    ])
    records = (recordResult.data ?? []).map((record) => ({
      ...record,
      student: Array.isArray(record.student) ? record.student[0] ?? null : record.student,
    })) as EnrollmentListItem[]
    students = (studentResult.data ?? []) as PersonOption[]
    professors = (professorResult.data ?? []) as PersonOption[]
    error = recordResult.error?.message ?? studentResult.error?.message ?? professorResult.error?.message ?? null
  }

  return <main className="page-main admin-users">
    <header className="admin-users__header"><div><h1>{t('adminTitle')}</h1><p>{t('adminDescription')}</p></div></header>
    {studentId ? <p className="admin-filter">{t('studentFilter', { studentId })} <Link href="/admin/enrollments">{t('clearFilter')}</Link></p> : null}
    {!isSupabaseConfigured() ? <p className="admin-notice">{t('notConfigured')}</p>
      : error ? <p className="admin-message admin-message--error">{error}</p>
      : <EnrollmentTable records={records} />}
    <section className="admin-create"><h2>{t('createTitle')}</h2>
      {students.length ? <EnrollmentForm students={students} professors={professors} /> : <p className="admin-notice">{t('noStudents')}</p>}
    </section>
  </main>
}
