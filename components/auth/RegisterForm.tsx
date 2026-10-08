'use client'

import { startTransition, useActionState, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { signUp, type AuthActionState } from '@/app/[locale]/(app)/actions/auth'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { confirmedPasswordIssue, passwordIssueMessageKey } from '@/lib/auth/password'

const initialState: AuthActionState = {}

export function RegisterForm() {
  const t = useTranslations('auth')
  const [state, formAction, pending] = useActionState(signUp, initialState)
  const [clientError, setClientError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const issue = confirmedPasswordIssue(
      String(formData.get('password') ?? ''),
      String(formData.get('confirmPassword') ?? ''),
    )
    if (issue) {
      setClientError(t(`errors.${passwordIssueMessageKey(issue)}`))
      return
    }
    setClientError(null)
    startTransition(() => {
      formAction(formData)
    })
  }

  const error = clientError ?? state.error

  return (
    <form className="auth-form" method="post" onSubmit={onSubmit}>
      {error ? <AuthAlert message={error} variant="error" /> : null}
      {state.success ? <AuthAlert message={state.success} variant="success" /> : null}
      <div className="auth-field">
        <label htmlFor="name">{t('name')}</label>
        <input id="name" name="name" type="text" autoComplete="name" required />
      </div>
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
          autoComplete="new-password"
          aria-describedby="register-password-rules"
          required
        />
        <p id="register-password-rules" className="auth-hint">
          {t('passwordRequirements')}
        </p>
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
        {t('register')}
      </button>
    </form>
  )
}
