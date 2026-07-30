import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  CourseForm,
  type EditableCourse,
  type ProfessorOption,
} from '@/components/courses/CourseForm'
import { Link } from '@/i18n/navigation'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminCourseDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations('adminCourses')

  if (!isSupabaseConfigured()) {
    return (
      <main className="page-main admin-users">
        <Link href="/admin/courses" className="admin-back">{t('backToList')}</Link>
        <p className="admin-notice">{t('notConfigured')}</p>
      </main>
    )
  }

  const supabase = await createClient()
  const [courseResult, professorResult] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('profiles')
      .select('id, name')
      .eq('role', UserRole.PROFESSOR)
      .order('name', { ascending: true, nullsFirst: false }),
  ])

  const error = courseResult.error ?? professorResult.error
  if (error) {
    return (
      <main className="page-main admin-users">
        <Link href="/admin/courses" className="admin-back">{t('backToList')}</Link>
        <p className="admin-message admin-message--error" role="alert">{error.message}</p>
      </main>
    )
  }
  if (!courseResult.data) notFound()

  const course = courseResult.data as EditableCourse
  const professors = (professorResult.data ?? []) as ProfessorOption[]

  return (
    <main className="page-main admin-users">
      <Link href="/admin/courses" className="admin-back">{t('backToList')}</Link>
      <header className="admin-users__header">
        <div>
          <h1>{course.name}</h1>
          <p>{t('editDescription')}</p>
        </div>
      </header>
      <section className="admin-card">
        <CourseForm course={course} professors={professors} />
      </section>
    </main>
  )
}
