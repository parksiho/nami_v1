'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  createCourse,
  updateCourse,
  type CourseActionState,
} from '@/app/[locale]/(app)/admin/courses/actions'

export type ProfessorOption = {
  id: string
  name: string | null
}

export type EditableCourse = {
  id: string
  name: string
  professor_id: string
  year: number
  semester: number
  credit: number
}

const initialState: CourseActionState = {}

export function CourseForm({
  professors,
  course,
}: {
  professors: ProfessorOption[]
  course?: EditableCourse
}) {
  const t = useTranslations('adminCourses')
  const action = course ? updateCourse.bind(null, course.id) : createCourse
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="admin-form">
      <div className="admin-form__grid">
        <label className="admin-form__wide">
          <span>{t('fields.name')}</span>
          <input name="name" defaultValue={course?.name} required />
        </label>
        <label>
          <span>{t('fields.professor')}</span>
          <select name="professorId" defaultValue={course?.professor_id ?? ''} required>
            <option value="" disabled>{t('selectProfessor')}</option>
            {professors.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.name || t('unnamedProfessor')}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('fields.year')}</span>
          <input
            name="year"
            type="number"
            min={1}
            step={1}
            defaultValue={course?.year ?? new Date().getFullYear()}
            required
          />
        </label>
        <label>
          <span>{t('fields.semester')}</span>
          <select name="semester" defaultValue={course?.semester ?? 1} required>
            <option value={1}>{t('semesters.1')}</option>
            <option value={2}>{t('semesters.2')}</option>
          </select>
        </label>
        <label>
          <span>{t('fields.credit')}</span>
          <input
            name="credit"
            type="number"
            min={1}
            step={1}
            defaultValue={course?.credit ?? 3}
            required
          />
        </label>
      </div>
      {state.error ? (
        <p className="admin-message admin-message--error" role="alert">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="admin-message admin-message--success" role="status">{state.success}</p>
      ) : null}
      <button type="submit" className="admin-button" disabled={pending || professors.length === 0}>
        {pending ? t('saving') : course ? t('save') : t('create')}
      </button>
    </form>
  )
}
