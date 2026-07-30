'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteEnrollment, type EnrollmentActionState } from '@/app/[locale]/(app)/admin/enrollments/actions'
import { Link } from '@/i18n/navigation'

export type EnrollmentListItem = {
  id: string
  grade_year: number | null
  year: number
  semester: number
  status: string
  student: { id: string; name: string | null } | null
}

function DeleteButton({ id }: { id: string }) {
  const t = useTranslations('enrollment')
  const [state, action, pending] = useActionState<EnrollmentActionState, FormData>(
    deleteEnrollment.bind(null, id),
    {},
  )
  return <form action={action}>
    <button className="admin-link-button" disabled={pending}>{pending ? t('deleting') : t('delete')}</button>
    {state.error ? <span className="admin-inline-error">{state.error}</span> : null}
  </form>
}

export function EnrollmentTable({ records }: { records: EnrollmentListItem[] }) {
  const t = useTranslations('enrollment')
  if (!records.length) return <p className="admin-notice">{t('noRecords')}</p>
  return <div className="admin-table-wrap"><table className="admin-table">
    <thead><tr>
      <th>{t('fields.student')}</th><th>{t('fields.gradeYear')}</th>
      <th>{t('fields.term')}</th><th>{t('fields.status')}</th><th>{t('fields.actions')}</th>
    </tr></thead>
    <tbody>{records.map((record) => <tr key={record.id}>
      <td><Link href={`/admin/enrollments/${record.id}`}>{record.student?.name || t('unnamedStudent')}</Link></td>
      <td>{record.grade_year ?? '–'}</td><td>{record.year} / {record.semester}</td>
      <td>{t(`statuses.${record.status}`)}</td><td><DeleteButton id={record.id} /></td>
    </tr>)}</tbody>
  </table></div>
}
