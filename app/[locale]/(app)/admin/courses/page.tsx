import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CourseForm, type ProfessorOption } from '@/components/courses/CourseForm'
import { CourseTable, type CourseListItem } from '@/components/courses/CourseTable'
import { Link } from '@/i18n/navigation'
import { getAdminCourseListParams } from '@/lib/admin/courses'
import { UserRole } from '@/lib/domain/enums'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; page?: string; professorId?: string }>
}

export default async function AdminCoursesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const queryParams = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('adminCourses')
  const list = getAdminCourseListParams(queryParams)
  let courses: CourseListItem[] = []
  let professors: ProfessorOption[] = []
  let count = 0
  let loadError: string | null = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    let request = supabase
      .from('courses')
      .select('id, name, year, semester, credit, professor:profiles!courses_professor_id_fkey(id, name)', {
        count: 'exact',
      })
      .order('year', { ascending: false })
      .order('semester', { ascending: false })
      .order('name', { ascending: true })
      .range(list.from, list.to)

    if (list.query) request = request.ilike('name', `%${list.query}%`)
    if (list.professorId) request = request.eq('professor_id', list.professorId)

    const [courseResult, professorResult] = await Promise.all([
      request,
      supabase
        .from('profiles')
        .select('id, name')
        .eq('role', UserRole.PROFESSOR)
        .order('name', { ascending: true, nullsFirst: false }),
    ])

    courses = (courseResult.data ?? []).map((course) => {
      const relatedProfessor = Array.isArray(course.professor)
        ? course.professor[0] ?? null
        : course.professor
      return {
        id: course.id,
        name: course.name,
        year: course.year,
        semester: course.semester,
        credit: course.credit,
        professor: relatedProfessor
          ? { id: relatedProfessor.id, name: relatedProfessor.name }
          : null,
      }
    })
    professors = (professorResult.data ?? []) as ProfessorOption[]
    count = courseResult.count ?? 0
    loadError = courseResult.error?.message ?? professorResult.error?.message ?? null
  }

  const pageCount = Math.max(1, Math.ceil(count / list.pageSize))
  const pageHref = (page: number) => ({
    pathname: '/admin/courses' as const,
    query: {
      ...(list.query ? { q: list.query } : {}),
      ...(list.professorId ? { professorId: list.professorId } : {}),
      page,
    },
  })

  return (
    <main className="page-main admin-users">
      <header className="admin-users__header">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        <form className="admin-search">
          <input
            name="q"
            defaultValue={list.query}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          {list.professorId ? (
            <input type="hidden" name="professorId" value={list.professorId} />
          ) : null}
          <button type="submit" className="admin-button">{t('search')}</button>
        </form>
      </header>

      {list.professorId ? (
        <p className="admin-filter">
          {t('professorFilter', { professorId: list.professorId })}{' '}
          <Link href="/admin/courses">{t('clearFilter')}</Link>
        </p>
      ) : null}

      {!isSupabaseConfigured() ? (
        <p className="admin-notice">{t('notConfigured')}</p>
      ) : loadError ? (
        <p className="admin-message admin-message--error" role="alert">{loadError}</p>
      ) : (
        <>
          <CourseTable courses={courses} />
          <nav className="admin-pagination" aria-label={t('pagination')}>
            {list.page > 1 ? <Link href={pageHref(list.page - 1)}>{t('previous')}</Link> : <span />}
            <span>{t('pageOf', { page: list.page, pages: pageCount })}</span>
            {list.page < pageCount ? <Link href={pageHref(list.page + 1)}>{t('next')}</Link> : <span />}
          </nav>
        </>
      )}

      <section className="admin-create">
        <h2>{t('createTitle')}</h2>
        {professors.length ? (
          <CourseForm professors={professors} />
        ) : (
          <p className="admin-notice">
            {isSupabaseConfigured() ? t('noProfessors') : t('notConfigured')}
          </p>
        )}
      </section>
    </main>
  )
}
