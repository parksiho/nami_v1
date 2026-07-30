'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  enrollInCourse,
  type EnrollmentActionState,
} from '@/app/[locale]/(app)/enroll/actions'

const initialState: EnrollmentActionState = {}

export function EnrollmentButton({
  courseId,
  enrolled,
}: {
  courseId: string
  enrolled: boolean
}) {
  const t = useTranslations('courseEnrollment')
  const [state, formAction, pending] = useActionState(enrollInCourse, initialState)

  return (
    <form action={formAction} className="course-action">
      <input type="hidden" name="courseId" value={courseId} />
      <button className="admin-button" type="submit" disabled={enrolled || pending}>
        {enrolled ? t('alreadyEnrolled') : pending ? t('enrolling') : t('enroll')}
      </button>
      {state.error ? <span className="admin-inline-error" role="alert">{state.error}</span> : null}
      {state.success ? <span className="course-action__success" role="status">{state.success}</span> : null}
    </form>
  )
}
