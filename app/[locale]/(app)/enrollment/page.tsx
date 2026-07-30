import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EnrollmentTimeline, type TimelineItem } from '@/components/enrollment/EnrollmentTimeline'
import { StudentCourseBlock, type StudentCourseItem } from '@/components/enrollment/StudentCourseBlock'
import { requireUser } from '@/lib/auth/require-user'
import { AcademicStatus, CourseEnrollmentStatus } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export default async function StudentEnrollmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('enrollment')
  if (!isSupabaseConfigured()) return <main className="page-main"><h1>{t('studentTitle')}</h1><p className="admin-notice">{t('notConfigured')}</p></main>

  const { user } = await requireUser()
  const supabase = await createClient()
  const [recordsResult, historyResult, coursesResult] = await Promise.all([
    supabase.from('enrollment_records').select('*').eq('student_id', user.id)
      .order('year', { ascending: false }).order('semester', { ascending: false }),
    supabase.from('enrollment_history')
      .select('id, from_status, to_status, reason, leave_start, leave_end, changed_at, advisor:profiles!enrollment_history_advisor_id_fkey(name)')
      .eq('student_id', user.id).order('changed_at', { ascending: false }),
    supabase.from('student_courses')
      .select('id, enrollment_status, score, pass, course:courses(name, year, semester, credit)')
      .eq('student_id', user.id).order('created_at', { ascending: false }),
  ])
  const error = recordsResult.error ?? historyResult.error ?? coursesResult.error
  if (error) return <main className="page-main"><p className="admin-message admin-message--error">{error.message}</p></main>
  const current = recordsResult.data?.[0]
  const histories = (historyResult.data ?? []).map((item) => ({
    ...item, advisor: Array.isArray(item.advisor) ? item.advisor[0] ?? null : item.advisor,
  })) as TimelineItem[]
  const courses = (coursesResult.data ?? []).map((item) => ({
    ...item, course: Array.isArray(item.course) ? item.course[0] ?? null : item.course,
  })) as StudentCourseItem[]

  return <main className="page-main course-page">
    <header className="course-page__header"><h1>{t('studentTitle')}</h1><p>{t('studentDescription')}</p></header>
    <section className="admin-card"><h2>{t('currentTitle')}</h2>
      {current ? <dl className="enrollment-summary">
        <div><dt>{t('fields.status')}</dt><dd>{t(`statuses.${current.status}`)}</dd></div>
        <div><dt>{t('fields.gradeYear')}</dt><dd>{current.grade_year ?? '–'}</dd></div>
        <div><dt>{t('fields.term')}</dt><dd>{current.year} / {current.semester}</dd></div>
        <div><dt>{t('fields.entrance')}</dt><dd>{current.entrance_info ?? '–'}</dd></div>
        <div><dt>{t('fields.graduate')}</dt><dd>{current.graduate_info ?? '–'}</dd></div>
      </dl> : <p>{t('noRecords')}</p>}
    </section>
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
