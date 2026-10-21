'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  uploadAvatar,
  type ProfileActionState,
} from '@/app/[locale]/(app)/profile/actions'
import type { AdminUserActionState } from '@/app/[locale]/(app)/admin/users/actions'

type UploadState = ProfileActionState | AdminUserActionState

type UploadAction = (
  previousState: UploadState,
  formData: FormData,
) => Promise<UploadState>

const initialState: UploadState = {}

type Props = {
  avatarUrl: string | null
  name: string | null
  action?: UploadAction
  title?: string
  help?: string
  uploadLabel?: string
  uploadingLabel?: string
  chooseLabel?: string
  emptyLabel?: string
}

export function AvatarUpload({
  avatarUrl,
  name,
  action = uploadAvatar,
  title,
  help,
  uploadLabel,
  uploadingLabel,
  chooseLabel,
  emptyLabel,
}: Props) {
  const t = useTranslations('profile')
  const [state, formAction, pending] = useActionState(action, initialState)
  const [validationError, setValidationError] = useState<string>()
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <section className="avatar-upload" aria-labelledby="avatar-upload-title">
      <div className="avatar-upload__preview" aria-hidden>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" />
        ) : (
          <span>{name?.trim().charAt(0).toUpperCase() || '?'}</span>
        )}
      </div>
      <form action={formAction} className="avatar-upload__form">
        <h2 id="avatar-upload-title">{title ?? t('photo')}</h2>
        <p>{help ?? t('avatarHelp')}</p>
        <div className="avatar-file">
          <input
            id="avatar"
            className="visually-hidden"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png"
            required
            aria-describedby="avatar-file-name"
            onChange={(event) => {
              const file = event.target.files?.[0]
              setFileName(file?.name ?? null)
              if (!file) return setValidationError(undefined)
              if (!['image/jpeg', 'image/png'].includes(file.type)) {
                return setValidationError(t('errors.avatarType'))
              }
              if (file.size > 2 * 1024 * 1024) {
                return setValidationError(t('errors.avatarSize'))
              }
              setValidationError(undefined)
            }}
          />
          <label className="profile-button profile-button--secondary avatar-file__button" htmlFor="avatar">
            {chooseLabel ?? t('choosePhoto')}
          </label>
          <span id="avatar-file-name" className="avatar-file__name">
            {fileName || (emptyLabel ?? t('noFileSelected'))}
          </span>
        </div>
        {validationError || state.error ? (
          <p className="profile-message profile-message--error" role="alert">
            {validationError ?? state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="profile-message profile-message--success" role="status">
            {state.success}
          </p>
        ) : null}
        <button
          className="profile-button profile-button--secondary"
          type="submit"
          disabled={pending || Boolean(validationError)}
        >
          {pending
            ? (uploadingLabel ?? t('uploading'))
            : (uploadLabel ?? t('upload'))}
        </button>
      </form>
    </section>
  )
}
