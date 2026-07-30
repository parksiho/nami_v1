'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  proxyEnrollStudent,
  type AdminUserActionState,
} from '@/app/[locale]/(app)/admin/users/actions'

type CourseOption = {
  id: string
  name: string
  year: number
  semester: number
}

const initialState: AdminUserActionState = {}

export function AdminEnrollmentForm({
  studentId,
  courses,
  existingCourseIds,
}: {
  studentId: string
  courses: CourseOption[]
  existingCourseIds: string[]
}) {
  const t = useTranslations('courseEnrollment.admin')
  const action = proxyEnrollStudent.bind(null, studentId)
  const [state, formAction, pending] = useActionState(action, initialState)
  const availableCourses = courses.filter((course) => !existingCourseIds.includes(course.id))

  return (
    <form action={formAction} className="admin-form">
      <label>
        <span>{t('course')}</span>
        <select name="courseId" defaultValue="" required disabled={availableCourses.length === 0}>
          <option value="" disabled>{t('selectCourse')}</option>
          {availableCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {t('courseOption', {
                name: course.name,
                year: course.year,
                semester: course.semester,
              })}
            </option>
          ))}
        </select>
      </label>
      {availableCourses.length === 0 ? <p className="admin-notice">{t('noCourses')}</p> : null}
      {state.error ? <p className="admin-message admin-message--error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="admin-message admin-message--success" role="status">{state.success}</p> : null}
      <button className="admin-button" type="submit" disabled={pending || availableCourses.length === 0}>
        {pending ? t('enrolling') : t('enroll')}
      </button>
    </form>
  )
}
