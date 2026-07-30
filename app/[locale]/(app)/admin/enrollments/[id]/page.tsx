import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EnrollmentForm, type EnrollmentRecord, type PersonOption } from '@/components/enrollment/EnrollmentForm'
import { EnrollmentTimeline, type TimelineItem } from '@/components/enrollment/EnrollmentTimeline'
import { StudentCourseBlock, type StudentCourseItem } from '@/components/enrollment/StudentCourseBlock'
import { Link } from '@/i18n/navigation'
import { AcademicStatus, CourseEnrollmentStatus, UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export default async function AdminEnrollmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('enrollment')
  if (!isSupabaseConfigured()) return <main className="page-main"><p className="admin-notice">{t('notConfigured')}</p></main>

  const supabase = await createClient()
  const recordResult = await supabase.from('enrollment_records')
    .select('*, student:profiles!enrollment_records_student_id_fkey(id, name)').eq('id', id).maybeSingle()
  if (recordResult.error) return <main className="page-main"><p className="admin-message admin-message--error">{recordResult.error.message}</p></main>
  if (!recordResult.data) notFound()
  const studentId = recordResult.data.student_id
  const [historyResult, coursesResult, studentsResult, professorsResult] = await Promise.all([
    supabase.from('enrollment_history')
      .select('id, from_status, to_status, reason, leave_start, leave_end, changed_at, advisor:profiles!enrollment_history_advisor_id_fkey(name)')
      .eq('student_id', studentId).order('changed_at', { ascending: false }),
    supabase.from('student_courses')
      .select('id, enrollment_status, score, pass, course:courses(name, year, semester, credit)')
      .eq('student_id', studentId).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, name').eq('role', UserRole.STUDENT).order('name'),
    supabase.from('profiles').select('id, name').eq('role', UserRole.PROFESSOR).order('name'),
  ])
  const student = Array.isArray(recordResult.data.student) ? recordResult.data.student[0] : recordResult.data.student
  const histories = (historyResult.data ?? []).map((item) => ({
    ...item,
    advisor: Array.isArray(item.advisor) ? item.advisor[0] ?? null : item.advisor,
  })) as TimelineItem[]
  const courses = (coursesResult.data ?? []).map((item) => ({
    ...item,
    course: Array.isArray(item.course) ? item.course[0] ?? null : item.course,
  })) as StudentCourseItem[]

  return <main className="page-main admin-users">
    <Link href="/admin/enrollments" className="admin-back">{t('backToList')}</Link>
    <header className="admin-users__header"><div><h1>{student?.name || t('unnamedStudent')}</h1><p>{t('detailDescription')}</p></div></header>
    <section className="admin-card"><h2>{t('editTitle')}</h2><EnrollmentForm
      record={recordResult.data as EnrollmentRecord}
      students={(studentsResult.data ?? []) as PersonOption[]}
      professors={(professorsResult.data ?? []) as PersonOption[]}
    /></section>
    <section className="admin-card"><h2>{t('timelineTitle')}</h2><EnrollmentTimeline
      items={histories}
      labels={Object.fromEntries(Object.values(AcademicStatus).map((status) => [status, t(`statuses.${status}`)])) as Record<AcademicStatus, string>}
      emptyLabel={t('noHistory')} reasonLabel={t('fields.changeReason')}
      leaveLabel={t('leavePeriod')} advisorLabel={t('fields.advisor')}
    /></section>
    <StudentCourseBlock courses={courses} title={t('coursesTitle')} emptyLabel={t('noCourses')}
      statusLabels={Object.fromEntries(Object.values(CourseEnrollmentStatus).map((status) => [status, t(`courseStatuses.${status}`)])) as Record<CourseEnrollmentStatus, string>}
    />
  </main>
}
