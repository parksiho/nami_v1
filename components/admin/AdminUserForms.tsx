'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  createAdminUser,
  updateAdminUser,
  type AdminUserActionState,
} from '@/app/[locale]/(app)/admin/users/actions'
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
  const [state, formAction, pending] = useActionState(createAdminUser, initialState)

  return (
    <form action={formAction} className="admin-form">
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
          <input name="password" type="password" minLength={6} autoComplete="new-password" required />
        </label>
        <label>
          <span>{t('fields.role')}</span>
          <RoleSelect defaultValue={UserRole.STUDENT} />
        </label>
      </div>
      <Message state={state} />
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
    ['nationality', profile.nationality],
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
