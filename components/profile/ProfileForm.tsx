'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import {
  updateProfile,
  type ProfileActionState,
} from '@/app/[locale]/(app)/profile/actions'
import { AddressField } from '@/components/profile/AddressField'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import type { Profile } from '@/lib/domain/profile'

const initialState: ProfileActionState = {}

type Props = {
  profile: Profile
  addressCorpus: string[]
  avatarUrl: string | null
}

function value(value: string | null): string {
  return value ?? ''
}

export function ProfileForm({ profile, addressCorpus, avatarUrl }: Props) {
  const t = useTranslations('profile')
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  )

  return (
    <div className="profile-card">
      <AvatarUpload
        avatarUrl={avatarUrl}
        name={profile.name}
      />

      <form action={formAction} className="profile-form">
        <div className="profile-form__grid">
          <div className="profile-field">
            <label htmlFor="name">{t('fields.name')}</label>
            <input
              id="name"
              name="name"
              defaultValue={value(profile.name)}
              autoComplete="name"
              required
            />
          </div>
          <div className="profile-field">
            <label htmlFor="birth_date">{t('fields.birthDate')}</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              defaultValue={value(profile.birth_date)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="occupation">{t('fields.occupation')}</label>
            <input
              id="occupation"
              name="occupation"
              defaultValue={value(profile.occupation)}
            />
          </div>
          {profile.role === 'STUDENT' ? (
            <>
              <div className="profile-field">
                <label htmlFor="student_number">{t('fields.studentNumber')}</label>
                <input
                  id="student_number"
                  name="student_number"
                  defaultValue={value(profile.student_number)}
                  autoComplete="off"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="enrolled_semester">{t('fields.enrolledSemester')}</label>
                <input
                  id="enrolled_semester"
                  name="enrolled_semester"
                  type="number"
                  step="1"
                  defaultValue={
                    profile.enrolled_semester === null
                      ? ''
                      : String(profile.enrolled_semester)
                  }
                />
              </div>
            </>
          ) : null}
          <div className="profile-field">
            <label htmlFor="mobile">{t('fields.mobile')}</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              defaultValue={value(profile.mobile)}
              autoComplete="tel"
            />
          </div>
          <div className="profile-field">
            <label htmlFor="email">{t('fields.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={value(profile.email)}
              autoComplete="email"
              disabled
            />
          </div>
          <div className="profile-field">
            <label htmlFor="nationality">{t('fields.nationality')}</label>
            <input
              id="nationality"
              name="nationality"
              defaultValue={value(profile.nationality)}
              autoComplete="country-name"
            />
          </div>
          <AddressField
            defaultValue={value(profile.address)}
            corpus={addressCorpus}
          />
          <div className="profile-field">
            <label htmlFor="gender">{t('fields.gender')}</label>
            <input
              id="gender"
              name="gender"
              defaultValue={value(profile.gender)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="church_name">{t('fields.churchName')}</label>
            <input
              id="church_name"
              name="church_name"
              defaultValue={value(profile.church_name)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="church_position">{t('fields.churchPosition')}</label>
            <input
              id="church_position"
              name="church_position"
              defaultValue={value(profile.church_position)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="preferred_language">
              {t('fields.preferredLanguage')}
            </label>
            <select
              id="preferred_language"
              name="preferred_language"
              defaultValue={value(profile.preferred_language)}
            >
              <option value="">{t('language.none')}</option>
              <option value="ko">{t('language.ko')}</option>
              <option value="en">{t('language.en')}</option>
              <option value="es">{t('language.es')}</option>
            </select>
          </div>
        </div>

        {state.error ? (
          <p className="profile-message profile-message--error" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="profile-message profile-message--success" role="status">
            {state.success}
          </p>
        ) : null}
        <button className="profile-button" type="submit" disabled={pending}>
          {pending ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  )
}
