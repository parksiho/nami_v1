'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteCourse, type CourseActionState } from '@/app/[locale]/(app)/admin/courses/actions'
import { Link } from '@/i18n/navigation'

export type CourseListItem = {
  id: string
  name: string
  year: number
  semester: number
  credit: number
  professor: { id: string; name: string | null } | null
}

const initialState: CourseActionState = {}

function DeleteCourseControl({ courseId }: { courseId: string }) {
  const t = useTranslations('adminCourses')
  const action = deleteCourse.bind(null, courseId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form
      action={formAction}
      className="admin-row-action"
      onSubmit={(event) => {
        if (!window.confirm(t('deleteConfirm'))) event.preventDefault()
      }}
    >
      <button type="submit" className="admin-link-button" disabled={pending}>
        {pending ? t('deleting') : t('delete')}
      </button>
      {state.error ? <span className="admin-inline-error" role="alert">{state.error}</span> : null}
    </form>
  )
}

export function CourseTable({ courses }: { courses: CourseListItem[] }) {
  const t = useTranslations('adminCourses')

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t('fields.name')}</th>
            <th>{t('fields.professor')}</th>
            <th>{t('fields.year')}</th>
            <th>{t('fields.semester')}</th>
            <th>{t('fields.credit')}</th>
            <th>{t('fields.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {courses.length ? courses.map((course) => (
            <tr key={course.id}>
              <td><Link href={`/admin/courses/${course.id}`}>{course.name}</Link></td>
              <td>{course.professor?.name || t('unnamedProfessor')}</td>
              <td>{course.year}</td>
              <td>{t(`semesters.${course.semester}`)}</td>
              <td>{course.credit}</td>
              <td className="admin-row-actions">
                <Link href={`/admin/courses/${course.id}`}>{t('edit')}</Link>
                <DeleteCourseControl courseId={course.id} />
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6}>{t('noCourses')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
