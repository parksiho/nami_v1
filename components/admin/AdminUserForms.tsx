'use client'

import { startTransition, useActionState, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  createAdminUser,
  updateAdminUser,
  type AdminUserActionState,
} from '@/app/[locale]/(app)/admin/users/actions'
import { NationalitySelect } from '@/components/forms/NationalitySelect'
import { getPasswordViolation, passwordViolationKey } from '@/lib/auth/password'
import { UserRole } from '@/lib/domain/enums'
import type { Profile } from '@/lib/domain/profile'

const initialState: AdminUserActionState = {}

function Message({ state }: { state: AdminUserActionState }) {
  if (state.error) {
    return <p className="admin-message admin-message--error" role="alert">{state.error}</p>
  }
  if (state.success) {
    return <p className="admin-message admin-message--success" role="status">{state.success}</p>
  }
  return null
}

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations('adminUsers')

  return (
    <select name="role" defaultValue={defaultValue} required>
      {Object.values(UserRole).map((role) => (
        <option key={role} value={role}>
          {t(`roles.${role}`)}
        </option>
      ))}
    </select>
  )
}

export function CreateAdminUserForm() {
  const t = useTranslations('adminUsers')
  const tAuth = useTranslations('auth')
  const [state, formAction, pending] = useActionState(createAdminUser, initialState)
  const [clientError, setClientError] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const violation = getPasswordViolation(String(formData.get('password') ?? ''))
    if (violation) {
      setClientError(tAuth(`errors.${passwordViolationKey(violation)}`))
      return
    }
    setClientError(null)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form className="admin-form" method="post" onSubmit={onSubmit}>
      <div className="admin-form__grid">
        <label>
          <span>{t('fields.name')}</span>
          <input name="name" required />
        </label>
        <label>
          <span>{t('fields.email')}</span>
          <input name="email" type="email" autoComplete="off" required />
        </label>
        <label>
          <span>{t('fields.password')}</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            aria-describedby="admin-password-rules"
            required
          />
          <p id="admin-password-rules" className="auth-hint">
            {tAuth('passwordRequirements')}
          </p>
        </label>
        <label>
          <span>{t('fields.role')}</span>
          <RoleSelect defaultValue={UserRole.STUDENT} />
        </label>
      </div>
      <Message state={clientError ? { error: clientError } : state} />
      <button type="submit" className="admin-button" disabled={pending}>
        {pending ? t('creating') : t('create')}
      </button>
    </form>
  )
}

function value(value: string | null): string {
  return value ?? ''
}

export function EditAdminUserForm({ profile }: { profile: Profile }) {
  const t = useTranslations('adminUsers')
  const action = updateAdminUser.bind(null, profile.id)
  const [state, formAction, pending] = useActionState(action, initialState)

  const fields = [
    ['name', profile.name],
    ['birth_date', profile.birth_date],
    ['occupation', profile.occupation],
    ['mobile', profile.mobile],
    ['address', profile.address],
    ['gender', profile.gender],
    ['church_name', profile.church_name],
    ['church_position', profile.church_position],
  ] as const

  return (
    <form action={formAction} className="admin-form">
      <div className="admin-form__grid">
        {fields.map(([field, current]) => (
          <label key={field} className={field === 'address' ? 'admin-form__wide' : undefined}>
            <span>{t(`fields.${field}`)}</span>
            <input
              name={field}
              type={field === 'birth_date' ? 'date' : 'text'}
              defaultValue={value(current)}
              required={field === 'name'}
            />
          </label>
        ))}
        <label>
          <span>{t('fields.nationality')}</span>
          <NationalitySelect defaultValue={profile.nationality} />
        </label>
        <label>
          <span>{t('fields.student_number')}</span>
          <input
            name="student_number"
            defaultValue={value(profile.student_number)}
            autoComplete="off"
          />
        </label>
        <label>
          <span>{t('fields.enrolled_semester')}</span>
          <input
            name="enrolled_semester"
            type="number"
            step="1"
            defaultValue={
              profile.enrolled_semester === null
                ? ''
                : String(profile.enrolled_semester)
            }
          />
        </label>
        <label>
          <span>{t('fields.email')}</span>
          <input value={value(profile.email)} disabled readOnly />
        </label>
        <label>
          <span>{t('fields.preferred_language')}</span>
          <select name="preferred_language" defaultValue={value(profile.preferred_language)}>
            <option value="">{t('languages.none')}</option>
            <option value="ko">{t('languages.ko')}</option>
            <option value="en">{t('languages.en')}</option>
            <option value="es">{t('languages.es')}</option>
          </select>
        </label>
        <label>
          <span>{t('fields.role')}</span>
          <RoleSelect defaultValue={profile.role} />
        </label>
      </div>
      <Message state={state} />
      <button type="submit" className="admin-button" disabled={pending}>
        {pending ? t('saving') : t('save')}
      </button>
    </form>
  )
}
