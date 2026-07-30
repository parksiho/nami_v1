'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { searchAddresses } from '@/lib/address/search'

type Props = {
  defaultValue: string
  corpus: string[]
}

export function AddressField({ defaultValue, corpus }: Props) {
  const t = useTranslations('profile')
  const [value, setValue] = useState(defaultValue)
  const suggestions = useMemo(
    () => searchAddresses(value, corpus),
    [corpus, value],
  )

  return (
    <div className="profile-field profile-field--wide">
      <label htmlFor="address">{t('fields.address')}</label>
      <input
        id="address"
        name="address"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="street-address"
        list="profile-address-suggestions"
        placeholder={t('addressPlaceholder')}
      />
      <datalist id="profile-address-suggestions">
        {suggestions.map((address) => (
          <option key={address} value={address} />
        ))}
      </datalist>
      <small>{t('addressHelp')}</small>
    </div>
  )
}
