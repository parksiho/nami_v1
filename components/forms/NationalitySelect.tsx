'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  getCountryOptions,
  resolveNationalityCode,
} from '@/lib/countries'

type Props = {
  id?: string
  name?: string
  defaultValue?: string | null
  required?: boolean
  className?: string
}

export function NationalitySelect({
  id = 'nationality',
  name = 'nationality',
  defaultValue = null,
  required = false,
  className,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('common')
  const options = getCountryOptions(locale)
  const resolved = resolveNationalityCode(defaultValue)
  const legacyValue =
    defaultValue?.trim() && !resolved ? defaultValue.trim() : null
  const selected = resolved ?? legacyValue ?? ''

  return (
    <select
      id={id}
      name={name}
      defaultValue={selected}
      required={required}
      className={className}
      autoComplete="country"
    >
      <option value="">{t('selectCountry')}</option>
      {legacyValue ? (
        <option value={legacyValue}>{legacyValue}</option>
      ) : null}
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.name}
        </option>
      ))}
    </select>
  )
}
