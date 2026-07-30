'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { updatePassword, type AuthActionState } from '@/app/[locale]/(app)/actions/auth'
import { AuthAlert } from '@/components/auth/AuthAlert'

const initialState: AuthActionState = {}

export function ChangePasswordForm() {
  const t = useTranslations('auth')
  const [state, formAction, pending] = useActionState(updatePassword, initialState)

  return (
    <form className="auth-form" action={formAction}>
      {state.error ? <AuthAlert message={state.error} variant="error" /> : null}
      {state.success ? <AuthAlert message={state.success} variant="success" /> : null}
      <div className="auth-field">
        <label htmlFor="password">{t('newPassword')}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="auth-field">
        <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <button className="auth-button" type="submit" disabled={pending}>
        {t('changePassword')}
      </button>
    </form>
  )
}
