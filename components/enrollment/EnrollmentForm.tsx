'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { createEnrollment, updateEnrollment, type EnrollmentActionState } from '@/app/[locale]/(app)/admin/enrollments/actions'
import { AcademicStatus } from '@/lib/domain/enums'

export type EnrollmentRecord = {
  id: string
  student_id: string
  grade_year: number | null
  year: number
  semester: number
  status: string
  entrance_info: string | null
  graduate_info: string | null
  change_reason: string | null
  leave_start: string | null
  leave_end: string | null
  advisor_professor_id: string | null
}

export type PersonOption = { id: string; name: string | null }
const initialState: EnrollmentActionState = {}

export function EnrollmentForm({
  record,
  students,
  professors,
}: {
  record?: EnrollmentRecord
  students: PersonOption[]
  professors: PersonOption[]
}) {
  const t = useTranslations('enrollment')
  const action = record ? updateEnrollment.bind(null, record.id) : createEnrollment
  const [state, formAction, pending] = useActionState(action, initialState)
  return (
    <form action={formAction} className="admin-form">
      <div className="admin-form__grid">
        <label className="admin-form__wide"><span>{t('fields.student')}</span>
          <select name="studentId" defaultValue={record?.student_id ?? ''} disabled={Boolean(record)} required>
            <option value="" disabled>{t('selectStudent')}</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name || t('unnamedStudent')}</option>)}
          </select>
          {record ? <input type="hidden" name="studentId" value={record.student_id} /> : null}
        </label>
        <label><span>{t('fields.gradeYear')}</span><input name="gradeYear" type="number" min="1" defaultValue={record?.grade_year ?? ''} /></label>
        <label><span>{t('fields.year')}</span><input name="year" type="number" min="1" defaultValue={record?.year ?? new Date().getFullYear()} required /></label>
        <label><span>{t('fields.semester')}</span><select name="semester" defaultValue={record?.semester ?? 1}><option value="1">1</option><option value="2">2</option></select></label>
        <label><span>{t('fields.status')}</span><select name="status" defaultValue={record?.status ?? AcademicStatus.ADMISSION}>
          {Object.values(AcademicStatus).map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
        </select></label>
        <label><span>{t('fields.entrance')}</span><input name="entrance" defaultValue={record?.entrance_info ?? ''} /></label>
        <label><span>{t('fields.graduate')}</span><input name="graduate" defaultValue={record?.graduate_info ?? ''} /></label>
        <label className="admin-form__wide"><span>{t('fields.changeReason')}</span><textarea name="changeReason" defaultValue={record?.change_reason ?? ''} /></label>
        <label><span>{t('fields.leaveStart')}</span><input name="leaveStart" type="date" defaultValue={record?.leave_start ?? ''} /></label>
        <label><span>{t('fields.leaveEnd')}</span><input name="leaveEnd" type="date" defaultValue={record?.leave_end ?? ''} /></label>
        <label className="admin-form__wide"><span>{t('fields.advisor')}</span><select name="advisorProfessorId" defaultValue={record?.advisor_professor_id ?? ''}>
          <option value="">{t('noAdvisor')}</option>
          {professors.map((professor) => <option key={professor.id} value={professor.id}>{professor.name || t('unnamedProfessor')}</option>)}
        </select></label>
      </div>
      {state.error ? <p className="admin-message admin-message--error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="admin-message admin-message--success" role="status">{state.success}</p> : null}
      <button className="admin-button" type="submit" disabled={pending}>{pending ? t('saving') : record ? t('save') : t('create')}</button>
    </form>
  )
}
