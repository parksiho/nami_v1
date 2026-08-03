'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  deleteAdminUser,
  setAdminUserActive,
  type AdminUserActionState,
} from '@/app/[locale]/(app)/admin/users/actions'

const initialState: AdminUserActionState = {}

type Props = {
  userId: string
  isActive: boolean
  canManage: boolean
}

export function AdminUserAccountControls({ userId, isActive, canManage }: Props) {
  const t = useTranslations('adminUsers')
  const activateAction = setAdminUserActive.bind(null, userId, true)
  const deactivateAction = setAdminUserActive.bind(null, userId, false)
  const removeAction = deleteAdminUser.bind(null, userId)
  const [activateState, activateFormAction, activating] = useActionState(
    activateAction,
    initialState,
  )
  const [deactivateState, deactivateFormAction, deactivating] = useActionState(
    deactivateAction,
    initialState,
  )
  const [deleteState, deleteFormAction, deleting] = useActionState(
    removeAction,
    initialState,
  )

  const message =
    deleteState.error ||
    deleteState.success ||
    deactivateState.error ||
    deactivateState.success ||
    activateState.error ||
    activateState.success
  const isError = Boolean(
    deleteState.error || deactivateState.error || activateState.error,
  )

  if (!canManage) {
    return (
      <section className="admin-card">
        <h2>{t('account.title')}</h2>
        <p className="admin-notice">{t('account.selfManaged')}</p>
      </section>
    )
  }

  return (
    <section className="admin-card">
      <h2>{t('account.title')}</h2>
      <p>{t('account.description')}</p>
      <div className="admin-account-actions">
        {isActive ? (
          <form
            action={deactivateFormAction}
            onSubmit={(event) => {
              if (!window.confirm(t('deactivateConfirm'))) event.preventDefault()
            }}
          >
            <button
              type="submit"
              className="admin-button admin-button--danger"
              disabled={deactivating || deleting}
            >
              {deactivating ? t('deactivating') : t('deactivate')}
            </button>
          </form>
        ) : (
          <form action={activateFormAction}>
            <button
              type="submit"
              className="admin-button"
              disabled={activating || deleting}
            >
              {activating ? t('activating') : t('activate')}
            </button>
          </form>
        )}
        <form
          action={deleteFormAction}
          onSubmit={(event) => {
            if (!window.confirm(t('deleteConfirm'))) event.preventDefault()
          }}
        >
          <button
            type="submit"
            className="admin-button admin-button--danger"
            disabled={deleting || activating || deactivating}
          >
            {deleting ? t('deleting') : t('delete')}
          </button>
        </form>
      </div>
      {message ? (
        <p
          className={
            isError
              ? 'admin-message admin-message--error'
              : 'admin-message admin-message--success'
          }
          role={isError ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
    </section>
  )
}
