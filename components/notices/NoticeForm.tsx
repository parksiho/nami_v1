'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  createNotice,
  deleteNotice,
  updateNotice,
  type NoticeActionState,
} from '@/app/[locale]/(app)/notices/actions'

export type EditableNotice = {
  id: string
  title: string
  body: string
}

const initialState: NoticeActionState = {}

export function NoticeForm({ notice }: { notice?: EditableNotice }) {
  const t = useTranslations('notices')
  const action = notice ? updateNotice.bind(null, notice.id) : createNotice
  const [state, formAction, pending] = useActionState(action, initialState)
  const [deleteState, deleteAction, deleting] = useActionState(
    notice ? deleteNotice.bind(null, notice.id) : createNotice,
    initialState,
  )

  return (
    <div className="notice-editor">
      <form action={formAction} className="admin-form">
        <label>
          <span>{t('fields.title')}</span>
          <input name="title" defaultValue={notice?.title} required />
        </label>
        <label>
          <span>{t('fields.body')}</span>
          <textarea name="body" defaultValue={notice?.body} rows={10} required />
        </label>
        {state.error ? <p className="admin-message admin-message--error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="admin-message admin-message--success" role="status">{state.success}</p> : null}
        <button className="admin-button" type="submit" disabled={pending}>
          {pending ? t('saving') : notice ? t('save') : t('create')}
        </button>
      </form>
      {notice ? (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm(t('deleteConfirm'))) event.preventDefault()
          }}
        >
          {deleteState.error ? <p className="admin-message admin-message--error" role="alert">{deleteState.error}</p> : null}
          <button className="admin-button admin-button--danger" type="submit" disabled={deleting}>
            {deleting ? t('deleting') : t('delete')}
          </button>
        </form>
      ) : null}
    </div>
  )
}
