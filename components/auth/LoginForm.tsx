'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { signIn, type AuthActionState } from '@/app/[locale]/(app)/actions/auth'
import { AuthAlert } from '@/components/auth/AuthAlert'

const initialState: AuthActionState = {}

export function LoginForm() {
  const t = useTranslations('auth')
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form className="auth-form" action={formAction}>
      {state.error ? <AuthAlert message={state.error} variant="error" /> : null}
      {state.success ? <AuthAlert message={state.success} variant="success" /> : null}
      <div className="auth-field">
        <label htmlFor="email">{t('email')}</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="auth-field">
        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="auth-button" type="submit" disabled={pending}>
        {t('login')}
      </button>
    </form>
  )
}
