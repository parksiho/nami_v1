'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  updateScore,
  type ScoreActionState,
} from '@/app/[locale]/(app)/teaching/actions'
import {
  CourseEnrollmentStatus,
  type CourseEnrollmentStatus as CourseEnrollmentStatusValue,
} from '@/lib/domain/enums'

const initialState: ScoreActionState = {}

export function ScoreEditor({
  enrollmentId,
  courseId,
  score,
  pass,
  status,
}: {
  enrollmentId: string
  courseId: string
  score: number | null
  pass: boolean | null
  status: CourseEnrollmentStatusValue
}) {
  const t = useTranslations('teaching')
  const action = updateScore.bind(null, enrollmentId, courseId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="score-editor">
      <label>
        <span>{t('fields.score')}</span>
        <input
          name="score"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={score ?? ''}
        />
      </label>
      <label>
        <span>{t('fields.status')}</span>
        <select name="status" defaultValue={status}>
          {Object.values(CourseEnrollmentStatus).map((value) => (
            <option key={value} value={value}>{t(`statuses.${value}`)}</option>
          ))}
        </select>
      </label>
      <label className="score-editor__pass">
        <input name="pass" type="checkbox" value="true" defaultChecked={pass ?? false} />
        <span>{t('fields.pass')}</span>
      </label>
      <button type="submit" className="admin-button" disabled={pending}>
        {pending ? t('saving') : t('save')}
      </button>
      {state.error ? <span className="admin-inline-error" role="alert">{state.error}</span> : null}
      {state.success ? <span className="course-action__success" role="status">{state.success}</span> : null}
    </form>
  )
}
